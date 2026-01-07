from rest_framework import authentication, exceptions
from django.contrib.auth import get_user_model
import jwt
from django.conf import settings
import requests
from functools import lru_cache
from jwt.algorithms import ECAlgorithm
from datetime import timedelta

User = get_user_model()


@lru_cache(maxsize=1)
def get_supabase_jwks():
    """Fetch Supabase JWKS (JSON Web Key Set)"""
    try:
        supabase_url = settings.SUPABASE_URL
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"

        print(f"🔑 Fetching JWKS from: {jwks_url}")
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()

        jwks = response.json()
        print(
            f"✅ JWKS fetched successfully: {len(jwks.get('keys', []))} keys found")
        return jwks
    except Exception as e:
        print(f"❌ Failed to fetch JWKS: {str(e)}")
        raise


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication backend for Supabase JWT tokens
    Supports both ECC (P-256) and RS256 algorithms
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            # Get JWKS
            jwks = get_supabase_jwks()

            # Get the unverified header to find the key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            alg = unverified_header.get('alg')

            print(f"🔍 Token uses algorithm: {alg}, key ID: {kid}")

            # Find the matching key
            public_key = None
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    print(f"✅ Found matching key for kid: {kid}")

                    # Convert JWK to public key based on algorithm
                    if alg in ['ES256', 'ES384', 'ES512']:  # ECC
                        public_key = ECAlgorithm.from_jwk(key)
                    elif alg in ['RS256', 'RS384', 'RS512']:  # RSA
                        from jwt.algorithms import RSAAlgorithm
                        public_key = RSAAlgorithm.from_jwk(key)
                    else:
                        raise exceptions.AuthenticationFailed(
                            f'Unsupported algorithm: {alg}')
                    break

            if not public_key:
                raise exceptions.AuthenticationFailed(
                    'No matching key found in JWKS')

            payload = jwt.decode(
                token,
                public_key,
                algorithms=[alg],
                audience='authenticated',
                leeway=timedelta(seconds=60),
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": True
                }
            )

            # Get user from payload
            supabase_user_id = payload.get('sub')
            email = payload.get('email')
            user_metadata = payload.get('user_metadata', {})

            print(f"📧 Email: {email}")
            print(f"🆔 Supabase User ID: {supabase_user_id}")

            if not supabase_user_id or not email:
                raise exceptions.AuthenticationFailed('Invalid token payload')

            # Get or create user in Django
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': user_metadata.get('first_name', ''),
                    'last_name': user_metadata.get('last_name', ''),
                    'avatar': user_metadata.get('avatar_url', ''),
                    'provider': 'supabase',
                    'provider_id': supabase_user_id,
                    'is_email_verified': True,
                }
            )

            if not created and user.provider == 'supabase':
                if user.provider_id != supabase_user_id:
                    user.provider_id = supabase_user_id
                    user.save(update_fields=['provider_id'])

            print(f"{'✨ Created' if created else '✅ Authenticated'} user: {email}")

            return (user, None)

        except jwt.ExpiredSignatureError:
            print("❌ Token has expired")
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidIssuedAtError:
            print("❌ Token issued at time (iat) is invalid - clock skew detected")
            raise exceptions.AuthenticationFailed(
                'Token timing is invalid (clock skew)')
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise exceptions.AuthenticationFailed(
                f'Authentication failed: {str(e)}')
