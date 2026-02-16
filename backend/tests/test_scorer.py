import pytest
from app.services.scorer import Scorer


@pytest.fixture
def scorer(sample_industry_config):
    """Scorer Instanz mit Test-Config"""
    return Scorer(sample_industry_config)


def test_score_direct_recommendation(scorer):
    """direct_recommendation → hoher Score"""
    analysis_result = {
        "mentioned": True,
        "mention_type": "direct_recommendation",
        "position": None,
        "sentiment": "positive",
    }

    score = scorer.score_single_result(analysis_result)

    # direct_recommendation hat weight 1.0, sollte hohen Score geben
    assert score >= 80
    assert score <= 100


def test_score_not_mentioned(scorer):
    """not_mentioned → Score 0"""
    analysis_result = {
        "mentioned": False,
        "mention_type": "not_mentioned",
        "position": None,
        "sentiment": "neutral",
    }

    score = scorer.score_single_result(analysis_result)

    assert score == 0


def test_position_bonus(scorer):
    """Position 1 gibt Bonus"""
    result_pos_1 = {
        "mentioned": True,
        "mention_type": "listed_among_top",
        "position": 1,
        "sentiment": "positive",
    }

    result_pos_3 = {
        "mentioned": True,
        "mention_type": "listed_among_top",
        "position": 3,
        "sentiment": "positive",
    }

    score_1 = scorer.score_single_result(result_pos_1)
    score_3 = scorer.score_single_result(result_pos_3)

    # Position 1 sollte höher scoren als Position 3
    assert score_1 > score_3


def test_platform_scores(scorer):
    """Korrekte Berechnung pro Plattform"""
    results = [
        {
            "platform": "chatgpt",
            "analysis": {
                "mentioned": True,
                "mention_type": "direct_recommendation",
                "position": None,
                "sentiment": "positive",
            }
        },
        {
            "platform": "chatgpt",
            "analysis": {
                "mentioned": False,
                "mention_type": "not_mentioned",
                "position": None,
                "sentiment": "neutral",
            }
        },
        {
            "platform": "claude",
            "analysis": {
                "mentioned": True,
                "mention_type": "mentioned_positively",
                "position": None,
                "sentiment": "positive",
            }
        },
    ]

    platform_scores = scorer.calculate_platform_scores(results)

    assert "chatgpt" in platform_scores
    assert "claude" in platform_scores

    # ChatGPT: 1 hoher Score, 1 null → Durchschnitt
    assert platform_scores["chatgpt"] > 0
    assert platform_scores["chatgpt"] < 100

    # Claude: nur positiv
    assert platform_scores["claude"] > 0


def test_overall_score_weighted(scorer, sample_industry_config):
    """Gewichteter Durchschnitt korrekt"""
    platform_scores = {
        "chatgpt": 80.0,  # weight 0.5
        "claude": 60.0,   # weight 0.5
    }

    overall = scorer.calculate_overall_score(platform_scores)

    # (80 * 0.5 + 60 * 0.5) = 70
    expected = 70.0
    assert overall == pytest.approx(expected)


def test_overall_score_range(scorer):
    """Score immer zwischen 0 und 100"""
    # Test mit extremen Werten
    test_cases = [
        {"chatgpt": 0, "claude": 0},
        {"chatgpt": 100, "claude": 100},
        {"chatgpt": 50, "claude": 75},
    ]

    for platform_scores in test_cases:
        overall = scorer.calculate_overall_score(platform_scores)
        assert 0 <= overall <= 100


def test_empty_results(scorer):
    """Leere Results → Score 0"""
    platform_scores = scorer.calculate_platform_scores([])

    # Sollte leeres dict oder dict mit 0-Werten sein
    assert len(platform_scores) == 0 or all(v == 0 for v in platform_scores.values())

    overall = scorer.calculate_overall_score(platform_scores)
    assert overall == 0


def test_score_mentioned_positively(scorer):
    """mentioned_positively → mittlerer Score"""
    analysis_result = {
        "mentioned": True,
        "mention_type": "mentioned_positively",
        "position": None,
        "sentiment": "positive",
    }

    score = scorer.score_single_result(analysis_result)

    # mentioned_positively hat weight 0.6
    assert score > 0
    assert score < 100
    # Sollte zwischen not_mentioned und direct_recommendation liegen
    assert 40 <= score <= 80


def test_score_mentioned_neutrally(scorer):
    """mentioned_neutrally → niedriger Score"""
    analysis_result = {
        "mentioned": True,
        "mention_type": "mentioned_neutrally",
        "position": None,
        "sentiment": "neutral",
    }

    score = scorer.score_single_result(analysis_result)

    # mentioned_neutrally hat weight 0.3
    assert score > 0
    assert score < 50
