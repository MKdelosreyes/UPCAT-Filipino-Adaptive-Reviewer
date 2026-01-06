from django.urls import path
from . import views

urlpatterns = [
    path('cors-test/', views.cors_test, name='cors_test'),
    # Traditional auth
    path('register/', views. register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),

    # Social auth
    path('auth/google/', views.google_auth, name='google_auth'),
    path('auth/social/', views.social_auth, name='social_auth'),

    # Profile
    path('profile/', views. profile, name='profile'),
    path('profile/update/', views. update_profile, name='update_profile'),
]
