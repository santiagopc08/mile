#ifndef PLATFORM_ENGINE_UI_HUD_HUD_MANAGER_HPP
#define PLATFORM_ENGINE_UI_HUD_HUD_MANAGER_HPP

#include "engine/ui/UIManager.hpp"
#include "engine/ui/hud/HUDViewModel.hpp"
#include "engine/ui/hud/HUDWidgets.hpp"

namespace platform
{
    class HUDManager
    {
    public:
        HUDManager();

        bool Initialize(UIManager &uiManager);
        void Update(const HUDViewModel &viewModel, double dt);

        [[nodiscard]] const HUDViewModel &GetViewModel() const { return m_viewModel; }
        [[nodiscard]] bool IsInitialized() const { return m_initialized; }

    private:
        HUDViewModel m_viewModel{};
        Canvas *m_hudCanvas{nullptr};

        std::shared_ptr<FuelGaugeWidget> m_fuelGauge;
        std::shared_ptr<SpeedMeterWidget> m_speedMeter;
        std::shared_ptr<DistanceCounterWidget> m_distanceCounter;
        std::shared_ptr<CoinCounterWidget> m_coinCounter;
        std::shared_ptr<ScoreCounterWidget> m_scoreCounter;
        std::shared_ptr<PauseIndicatorWidget> m_pauseIndicator;

        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_UI_HUD_HUD_MANAGER_HPP
