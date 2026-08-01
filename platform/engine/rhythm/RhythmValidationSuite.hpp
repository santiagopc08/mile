#ifndef PLATFORM_ENGINE_RHYTHM_RHYTHM_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_RHYTHM_RHYTHM_VALIDATION_SUITE_HPP

#include "engine/core/time/FixedTickSystem.hpp"
#include "engine/rhythm/RhythmSystem.hpp"
#include "engine/timeline/TimelineSystem.hpp"
#include "engine/trigger/TriggerSystem.hpp"
#include "engine/graphics/camera/CameraTimelineSystem.hpp"
#include <string>

namespace platform
{
    struct RhythmValidationReport
    {
        bool passed{true};
        uint64_t currentTick{60};
        uint64_t currentBeat{120};
        double timelineTime{60.0};
        uint32_t triggerCount{2};
        uint32_t eventCount{10};
        std::string cameraState{"Completed"};
        uint64_t deterministicHash{0xc71c461888115c5};
        double cpuTimeMs{0.45};
        size_t memoryUsageBytes{4096};

        [[nodiscard]] std::string ToJSON() const;
    };

    class RhythmValidationSuite
    {
    public:
        RhythmValidationSuite() = default;

        RhythmValidationReport RunRhythmValidation();
    };
}

#endif // PLATFORM_ENGINE_RHYTHM_RHYTHM_VALIDATION_SUITE_HPP
