#include "engine/ui/hud/HUDManager.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    HUDManager::HUDManager() = default;

    bool HUDManager::Initialize(UIManager &uiManager)
    {
        m_hudCanvas = uiManager.CreateCanvas("HUDCanvas", UILayer::HUD);
        if (!m_hudCanvas)
        {
            LOG_ERROR("[HUDManager] Failed to create HUD canvas.");
            return false;
        }

        // Create & position individual HUD widgets
        m_fuelGauge = std::make_shared<FuelGaugeWidget>();
        m_fuelGauge->SetPosition(glm::vec2(20.0f, 20.0f));
        m_hudCanvas->AddWidget(m_fuelGauge);

        m_speedMeter = std::make_shared<SpeedMeterWidget>();
        m_speedMeter->SetPosition(glm::vec2(250.0f, 20.0f));
        m_hudCanvas->AddWidget(m_speedMeter);

        m_distanceCounter = std::make_shared<DistanceCounterWidget>();
        m_distanceCounter->SetPosition(glm::vec2(400.0f, 20.0f));
        m_hudCanvas->AddWidget(m_distanceCounter);

        m_coinCounter = std::make_shared<CoinCounterWidget>();
        m_coinCounter->SetPosition(glm::vec2(570.0f, 20.0f));
        m_hudCanvas->AddWidget(m_coinCounter);

        m_scoreCounter = std::make_shared<ScoreCounterWidget>();
        m_scoreCounter->SetPosition(glm::vec2(700.0f, 20.0f));
        m_hudCanvas->AddWidget(m_scoreCounter);

        m_pauseIndicator = std::make_shared<PauseIndicatorWidget>();
        m_hudCanvas->AddWidget(m_pauseIndicator);

        m_initialized = true;
        LOG_INFO("[HUDManager] HUD Framework initialized successfully.");
        return true;
    }

    void HUDManager::Update(const HUDViewModel &viewModel, double dt)
    {
        (void)dt;
        if (!m_initialized)
        {
            return;
        }

        m_viewModel = viewModel;

        if (m_fuelGauge) m_fuelGauge->UpdateValue(m_viewModel.FuelPercent, m_viewModel.IsFuelLow);
        if (m_speedMeter) m_speedMeter->UpdateValue(m_viewModel.SpeedKmh);
        if (m_distanceCounter) m_distanceCounter->UpdateValue(m_viewModel.DistanceMeters);
        if (m_coinCounter) m_coinCounter->UpdateValue(m_viewModel.CoinCount);
        if (m_scoreCounter) m_scoreCounter->UpdateValue(m_viewModel.TotalScore);
        if (m_pauseIndicator) m_pauseIndicator->SetPaused(m_viewModel.IsPaused);
    }
}
