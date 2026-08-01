#ifndef PLATFORM_ENGINE_RELEASE_RELEASE_VALIDATION_SUITE_GAME002_HPP
#define PLATFORM_ENGINE_RELEASE_RELEASE_VALIDATION_SUITE_GAME002_HPP

#include "engine/character/CharacterValidationSuite.hpp"
#include "engine/world/WorldValidationSuite.hpp"
#include "engine/gameplay/GameplayValidationSuiteMS18.hpp"
#include "engine/level/LevelValidationSuite.hpp"
#include "engine/presentation/PresentationValidationController2D.hpp"
#include "engine/audio/PlatformerAudioValidationController.hpp"
#include "engine/graphics/vfx/PlatformerVFXValidationController.hpp"
#include "engine/diagnostics/PlatformerPerformanceProfiler.hpp"
#include <string>

namespace platform
{
    struct ReleaseValidationReportGAME002
    {
        bool passed{true};
        bool characterStackPassed{true};
        bool worldStackPassed{true};
        bool gameplayStackPassed{true};
        bool levelStackPassed{true};
        bool presentationStackPassed{true};
        bool audioStackPassed{true};
        bool vfxStackPassed{true};
        bool performanceBudgetsPassed{true};
        std::string gameTitle{"GAME-002: Mario & Luigi Platformer Engine"};
        std::string version{"v1.0.0-RC"};

        [[nodiscard]] std::string ToJSON() const;
    };

    class ReleaseValidationSuiteGAME002
    {
    public:
        ReleaseValidationSuiteGAME002() = default;

        ReleaseValidationReportGAME002 RunReleaseValidation();
    };
}

#endif // PLATFORM_ENGINE_RELEASE_RELEASE_VALIDATION_SUITE_GAME002_HPP
