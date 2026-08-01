#include "engine/timeline/TimelineValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void TimelineValidationController::Initialize()
    {
        m_step = TimelineValidationStep::LoadTimeline;
        m_timelineEntity = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        m_deterministicOrdering = true;
        m_executedEventOrder.clear();
        LOG_INFO("[TimelineValidationController] Initialized autonomous timeline framework validation sequence.");
    }

    std::string TimelineValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case TimelineValidationStep::LoadTimeline: return "LoadTimeline";
        case TimelineValidationStep::Play: return "Play";
        case TimelineValidationStep::Pause: return "Pause";
        case TimelineValidationStep::Resume: return "Resume";
        case TimelineValidationStep::Seek: return "Seek";
        case TimelineValidationStep::Restart: return "Restart";
        case TimelineValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void TimelineValidationController::Update(Registry &registry, TimelineSystem &timelineSystem, double dt)
    {
        if (m_timelineEntity == kNullEntity)
        {
            m_timelineEntity = registry.CreateEntity("TimelineController");
        }

        m_stepTimer += dt;

        switch (m_step)
        {
        case TimelineValidationStep::LoadTimeline:
            {
                std::vector<TimelineEventData> events = {
                    { 101, 0.1, 10, "EventA" },
                    { 102, 0.2, 20, "EventB_HighPriority" },
                    { 103, 0.2, 10, "EventC_LowPriority" },
                    { 104, 0.5, 5,  "EventD" }
                };
                timelineSystem.loadTimeline(registry, m_timelineEntity, events, 1.0);
                m_step = TimelineValidationStep::Play;
                m_stepTimer = 0.0;
                LOG_INFO("[TimelineValidationController] Transitioned -> Play");
            }
            break;

        case TimelineValidationStep::Play:
            timelineSystem.play(registry, m_timelineEntity);
            timelineSystem.Update(registry, 0.3, [this](const TimelineEventData &evt) {
                m_executedEventOrder.push_back(evt.eventID);
            });

            // Verify priority ordering for simultaneous events at 0.2s: event 102 (priority 20) before event 103 (priority 10)
            if (m_executedEventOrder.size() >= 3)
            {
                if (m_executedEventOrder[0] != 101 || m_executedEventOrder[1] != 102 || m_executedEventOrder[2] != 103)
                {
                    m_deterministicOrdering = false;
                }
            }

            m_step = TimelineValidationStep::Pause;
            m_stepTimer = 0.0;
            LOG_INFO("[TimelineValidationController] Transitioned -> Pause");
            break;

        case TimelineValidationStep::Pause:
            timelineSystem.pause(registry, m_timelineEntity);
            m_step = TimelineValidationStep::Resume;
            m_stepTimer = 0.0;
            LOG_INFO("[TimelineValidationController] Transitioned -> Resume");
            break;

        case TimelineValidationStep::Resume:
            timelineSystem.resume(registry, m_timelineEntity);
            timelineSystem.Update(registry, 0.3, [this](const TimelineEventData &evt) {
                m_executedEventOrder.push_back(evt.eventID);
            });
            m_step = TimelineValidationStep::Seek;
            m_stepTimer = 0.0;
            LOG_INFO("[TimelineValidationController] Transitioned -> Seek");
            break;

        case TimelineValidationStep::Seek:
            timelineSystem.seek(registry, m_timelineEntity, 0.1);
            m_step = TimelineValidationStep::Restart;
            m_stepTimer = 0.0;
            LOG_INFO("[TimelineValidationController] Transitioned -> Restart");
            break;

        case TimelineValidationStep::Restart:
            timelineSystem.restart(registry, m_timelineEntity);
            m_cycleCount++;
            LOG_INFO("[TimelineValidationController] Completed full timeline validation cycle (Count: {}). Deterministic: {}.",
                     m_cycleCount, m_deterministicOrdering ? "PASSED" : "FAILED");
            m_step = TimelineValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case TimelineValidationStep::Repeat:
            m_step = TimelineValidationStep::LoadTimeline;
            m_stepTimer = 0.0;
            break;
        }
    }
}
