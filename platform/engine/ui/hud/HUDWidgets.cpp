#include "engine/ui/hud/HUDWidgets.hpp"
#include <cstdio>

namespace platform
{
    // FuelGaugeWidget
    FuelGaugeWidget::FuelGaugeWidget()
        : Panel("FuelGauge")
    {
        SetSize(glm::vec2(220.0f, 30.0f));
        SetBackgroundColor(glm::vec4(0.1f, 0.1f, 0.12f, 0.8f));

        m_progressBar = std::make_shared<ProgressBar>("FuelBar");
        m_progressBar->SetPosition(glm::vec2(10.0f, 5.0f));
        m_progressBar->SetSize(glm::vec2(200.0f, 20.0f));
        m_progressBar->SetFillColor(glm::vec4(0.2f, 0.8f, 0.3f, 1.0f));

        AddChild(m_progressBar);
    }

    void FuelGaugeWidget::UpdateValue(float fuelPercent, bool isLow)
    {
        if (m_progressBar)
        {
            m_progressBar->SetProgress(fuelPercent);
            if (isLow)
            {
                m_progressBar->SetFillColor(glm::vec4(0.9f, 0.2f, 0.2f, 1.0f));
            }
            else
            {
                m_progressBar->SetFillColor(glm::vec4(0.2f, 0.85f, 0.3f, 1.0f));
            }
        }
    }

    // SpeedMeterWidget
    SpeedMeterWidget::SpeedMeterWidget()
        : Panel("SpeedMeter")
    {
        SetSize(glm::vec2(140.0f, 30.0f));
        SetBackgroundColor(glm::vec4(0.1f, 0.1f, 0.12f, 0.8f));

        m_valueLabel = std::make_shared<Label>("SpeedLabel", "Speed: 0 km/h");
        m_valueLabel->SetPosition(glm::vec2(10.0f, 5.0f));
        m_valueLabel->SetSize(glm::vec2(120.0f, 20.0f));
        AddChild(m_valueLabel);
    }

    void SpeedMeterWidget::UpdateValue(float speedKmh)
    {
        if (m_valueLabel)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "Speed: %.0f km/h", speedKmh);
            m_valueLabel->SetText(buf);
        }
    }

    // DistanceCounterWidget
    DistanceCounterWidget::DistanceCounterWidget()
        : Panel("DistanceCounter")
    {
        SetSize(glm::vec2(160.0f, 30.0f));
        SetBackgroundColor(glm::vec4(0.1f, 0.1f, 0.12f, 0.8f));

        m_valueLabel = std::make_shared<Label>("DistanceLabel", "Distance: 0 m");
        m_valueLabel->SetPosition(glm::vec2(10.0f, 5.0f));
        m_valueLabel->SetSize(glm::vec2(140.0f, 20.0f));
        AddChild(m_valueLabel);
    }

    void DistanceCounterWidget::UpdateValue(float distanceMeters)
    {
        if (m_valueLabel)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "Distance: %.0f m", distanceMeters);
            m_valueLabel->SetText(buf);
        }
    }

    // CoinCounterWidget
    CoinCounterWidget::CoinCounterWidget()
        : Panel("CoinCounter")
    {
        SetSize(glm::vec2(120.0f, 30.0f));
        SetBackgroundColor(glm::vec4(0.1f, 0.1f, 0.12f, 0.8f));

        m_valueLabel = std::make_shared<Label>("CoinLabel", "Coins: 0");
        m_valueLabel->SetPosition(glm::vec2(10.0f, 5.0f));
        m_valueLabel->SetSize(glm::vec2(100.0f, 20.0f));
        m_valueLabel->SetTextColor(glm::vec4(1.0f, 0.84f, 0.0f, 1.0f));
        AddChild(m_valueLabel);
    }

    void CoinCounterWidget::UpdateValue(uint32_t coinCount)
    {
        if (m_valueLabel)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "Coins: %u", coinCount);
            m_valueLabel->SetText(buf);
        }
    }

    // ScoreCounterWidget
    ScoreCounterWidget::ScoreCounterWidget()
        : Panel("ScoreCounter")
    {
        SetSize(glm::vec2(150.0f, 30.0f));
        SetBackgroundColor(glm::vec4(0.1f, 0.1f, 0.12f, 0.8f));

        m_valueLabel = std::make_shared<Label>("ScoreLabel", "Score: 0");
        m_valueLabel->SetPosition(glm::vec2(10.0f, 5.0f));
        m_valueLabel->SetSize(glm::vec2(130.0f, 20.0f));
        m_valueLabel->SetTextColor(glm::vec4(0.4f, 0.9f, 1.0f, 1.0f));
        AddChild(m_valueLabel);
    }

    void ScoreCounterWidget::UpdateValue(uint32_t score)
    {
        if (m_valueLabel)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "Score: %u", score);
            m_valueLabel->SetText(buf);
        }
    }

    // PauseIndicatorWidget
    PauseIndicatorWidget::PauseIndicatorWidget()
        : Panel("PauseIndicator")
    {
        SetSize(glm::vec2(200.0f, 60.0f));
        SetPosition(glm::vec2(540.0f, 330.0f)); // Center screen for 1280x720
        SetBackgroundColor(glm::vec4(0.8f, 0.1f, 0.1f, 0.9f));

        auto label = std::make_shared<Label>("PauseLabel", "[PAUSED]");
        label->SetPosition(glm::vec2(50.0f, 20.0f));
        label->SetSize(glm::vec2(100.0f, 20.0f));
        label->SetTextColor(glm::vec4(1.0f, 1.0f, 1.0f, 1.0f));
        AddChild(label);

        SetVisible(false);
    }

    void PauseIndicatorWidget::SetPaused(bool paused)
    {
        SetVisible(paused);
    }
}
