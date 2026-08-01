#ifndef PLATFORM_ENGINE_UI_PRESENTATION_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_UI_PRESENTATION_VALIDATION_SUITE_HPP

#include "engine/ui/MainMenuScreen.hpp"
#include "engine/gameplay/ui/GameplayHUDViewModel.hpp"
#include "engine/gameplay/ui/GameplayHUD.hpp"
#include "engine/gameplay/PauseFlowSystem.hpp"
#include "engine/audio/GameplayAudioSystem.hpp"
#include "engine/graphics/VFXSystem.hpp"
#include "engine/graphics/camera/CameraEffectsSystem.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include <string>

namespace platform
{
    struct PresentationValidationReport
    {
        bool passed{true};
        double frameTimeMs{0.0};
        uint32_t drawCalls{0};
        uint32_t audioVoices{0};
        uint32_t widgetCount{0};
        std::string cameraState{"Active"};
        uint32_t effectCount{0};
        size_t memoryBytes{0};
        double cpuTimeMs{0.0};

        [[nodiscard]] std::string ToJSON() const;
    };

    class PresentationValidationSuite
    {
    public:
        PresentationValidationSuite() = default;

        PresentationValidationReport RunFullValidation();
    };
}

#endif // PLATFORM_ENGINE_UI_PRESENTATION_VALIDATION_SUITE_HPP
