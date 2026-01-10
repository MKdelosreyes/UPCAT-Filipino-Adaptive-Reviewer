"""
Token counting and rate limit diagnostics for Gemini API
"""
import time
from typing import Dict, List
from datetime import datetime, timedelta


class TokenCounter:
    def __init__(self):
        self.requests: List[Dict] = []
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.request_count = 0

    def count_tokens(self, text: str) -> int:
        """
        Approximate token count (rough estimate)
        Gemini uses ~4 chars per token on average for English
        Filipino might be similar or slightly more
        """
        return len(text) // 4

    def log_request(self, endpoint: str, prompt: str, response: str = ""):
        """Log a request with token counts"""
        input_tokens = self.count_tokens(prompt)
        output_tokens = self.count_tokens(response) if response else 0

        self.request_count += 1
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens

        request_info = {
            "timestamp": datetime.now(),
            "endpoint": endpoint,
            "request_num": self.request_count,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "prompt_length": len(prompt),
            "response_length": len(response)
        }

        self.requests.append(request_info)

        # Print immediate feedback
        print(f"\n{'='*60}")
        print(f"📊 Token Usage Report - Request #{self.request_count}")
        print(f"{'='*60}")
        print(f"🎯 Endpoint: {endpoint}")
        print(f"📥 Input Tokens: {input_tokens:,} (~{len(prompt):,} chars)")
        print(f"📤 Output Tokens: {output_tokens:,} (~{len(response):,} chars)")
        print(f"💰 Total Tokens: {input_tokens + output_tokens:,}")
        print(
            f"📈 Session Total: {self.total_input_tokens + self.total_output_tokens:,} tokens")
        print(f"🔢 Total Requests: {self.request_count}")
        print(f"{'='*60}\n")

        return request_info

    def get_recent_requests(self, minutes: int = 1) -> List[Dict]:
        """Get requests from the last N minutes"""
        cutoff = datetime.now() - timedelta(minutes=minutes)
        return [r for r in self.requests if r["timestamp"] > cutoff]

    def get_rate_limit_status(self) -> Dict:
        """Check current rate limit status"""
        recent_1min = self.get_recent_requests(1)
        recent_5min = self.get_recent_requests(5)

        return {
            "requests_last_1min": len(recent_1min),
            "requests_last_5min": len(recent_5min),
            "tokens_last_1min": sum(r["total_tokens"] for r in recent_1min),
            "tokens_last_5min": sum(r["total_tokens"] for r in recent_5min),
            "total_session_tokens": self.total_input_tokens + self.total_output_tokens,
            "total_session_requests": self.request_count
        }

    def print_summary(self):
        """Print session summary"""
        status = self.get_rate_limit_status()

        print(f"\n{'='*60}")
        print(f"📊 GEMINI API SESSION SUMMARY")
        print(f"{'='*60}")
        print(f"🔢 Total Requests: {status['total_session_requests']}")
        print(f"💰 Total Tokens: {status['total_session_tokens']:,}")
        print(f"📥 Input Tokens: {self.total_input_tokens:,}")
        print(f"📤 Output Tokens: {self.total_output_tokens:,}")
        print(f"\n⏱️  RATE LIMIT STATUS:")
        print(
            f"   Last 1 min: {status['requests_last_1min']} requests, {status['tokens_last_1min']:,} tokens")
        print(
            f"   Last 5 min: {status['requests_last_5min']} requests, {status['tokens_last_5min']:,} tokens")
        print(f"{'='*60}\n")


# Global singleton
_token_counter = None


def get_token_counter() -> TokenCounter:
    """Get or create token counter singleton"""
    global _token_counter
    if _token_counter is None:
        _token_counter = TokenCounter()
    return _token_counter
