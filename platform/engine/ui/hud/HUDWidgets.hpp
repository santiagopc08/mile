#ifndef PLATFORM_ENGINE_UI_HUD_HUD_WIDGETS_HPP
#define PLATFORM_ENGINE_UI_HUD_HUD_WIDGETS_HPP

#include "engine/ui/widgets/Panel.hpp"
#include "engine/ui/widgets/Label.hpp"
#include "engine/ui/widgets/ProgressBar.hpp"
#include "engine/ui/hud/HUDViewModel.hpp"

namespace platform
{
    class FuelGaugeWidget : public Panel
    {
    public:
        FuelGaugeWidget();
        void UpdateValue(float fuelPercent, bool isLow);

    private:
        std::shared_ptr<ProgressBar> m_progressBar;
        std::shared_ptr<Label> m_label;
    };

    class SpeedMeterWidget : public Panel
    {
    public:
        SpeedMeterWidget();
        void UpdateValue(float speedKmh);

    private:
        std::shared_ptr<Label> m_valueLabel;
    };

    class DistanceCounterWidget : public Panel
    {
    public:
        DistanceCounterWidget();
        void UpdateValue(float distanceMeters);

    private:
        std::shared_ptr<Label> m_valueLabel;
    };

    class CoinCounterWidget : public Panel
    {
    public:
        CoinCounterWidget();
        void UpdateValue(uint32_t coinCount);

    private:
        std::shared_ptr<Label> m_valueLabel;
    };

    class ScoreCounterWidget : public Panel
    {
    public:
        ScoreCounterWidget();
        void UpdateValue(uint32_t score);

    private:
        std::shared_ptr<Label> m_valueLabel;
    };

    class PauseIndicatorWidget : public Panel
    {
    public:
        PauseIndicatorWidget();
        void SetPaused(bool paused);
    };
}

#endif // PLATFORM_ENGINE_UI_HUD_HUD_WIDGETS_HPP
