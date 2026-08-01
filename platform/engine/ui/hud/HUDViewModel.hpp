#ifndef PLATFORM_ENGINE_UI_HUD_HUD_VIEW_MODEL_HPP
#define PLATFORM_ENGINE_UI_HUD_HUD_VIEW_MODEL_HPP

#include <cstdint>

namespace platform
{
    struct HUDViewModel
    {
        float FuelPercent{1.0f};      // 0.0 to 1.0
        float SpeedKmh{0.0f};         // km/h
        float DistanceMeters{0.0f};   // meters
        uint32_t CoinCount{0};
        uint32_t TotalScore{0};
        bool IsPaused{false};
        bool IsFuelLow{false};
    };
}

#endif // PLATFORM_ENGINE_UI_HUD_HUD_VIEW_MODEL_HPP
