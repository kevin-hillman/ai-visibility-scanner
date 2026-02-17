import pytest
from app.services.cost_calculator import CostCalculator


class TestCostCalculator:
    def setup_method(self):
        self.calc = CostCalculator()

    def test_calculate_cost_openai(self):
        cost = self.calc.calculate_cost(model="gpt-4o", input_tokens=500, output_tokens=300)
        expected = (500 * 2.50 / 1_000_000) + (300 * 10.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_claude(self):
        cost = self.calc.calculate_cost(model="claude-sonnet-4-5-20250929", input_tokens=400, output_tokens=600)
        expected = (400 * 3.00 / 1_000_000) + (600 * 15.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_gemini(self):
        cost = self.calc.calculate_cost(model="gemini-2.0-flash", input_tokens=1000, output_tokens=500)
        expected = (1000 * 0.10 / 1_000_000) + (500 * 0.40 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_perplexity(self):
        cost = self.calc.calculate_cost(model="sonar", input_tokens=800, output_tokens=400)
        expected = (800 * 1.00 / 1_000_000) + (400 * 1.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_unknown_model_uses_fallback(self):
        cost = self.calc.calculate_cost(model="unknown-xyz", input_tokens=1000, output_tokens=500)
        expected = (1000 * 5.00 / 1_000_000) + (500 * 15.00 / 1_000_000)
        assert abs(cost - expected) < 0.0001

    def test_estimate_tokens_from_text(self):
        text = "Dies ist ein Testtext mit einigen Wörtern."
        tokens = self.calc.estimate_tokens(text)
        assert 8 <= tokens <= 15

    def test_get_pricing_returns_dict(self):
        pricing = self.calc.get_pricing()
        assert "gpt-4o" in pricing
        assert "input" in pricing["gpt-4o"]
        assert "output" in pricing["gpt-4o"]
