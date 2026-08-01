#include "engine/timeline/TimelineSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void TimelineSystem::loadTimeline(Registry &registry, EntityID timelineEntity, const std::vector<TimelineEventData> &events, double duration)
    {
        auto *settings = registry.GetComponent<TimelineSettingsComponent>(timelineEntity);
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);

        if (!settings) settings = &registry.AddComponent<TimelineSettingsComponent>(timelineEntity);
        if (!runtime) runtime = &registry.AddComponent<TimelineRuntimeComponent>(timelineEntity);

        settings->events = events;
        settings->duration = duration;

        // Sort events deterministically: primary key timestamp, secondary key priority (descending), tertiary key eventID
        std::stable_sort(settings->events.begin(), settings->events.end(), [](const TimelineEventData &a, const TimelineEventData &b) {
            if (a.timestamp != b.timestamp) return a.timestamp < b.timestamp;
            if (a.priority != b.priority) return a.priority > b.priority;
            return a.eventID < b.eventID;
        });

        runtime->state = TimelineState::Loaded;
        runtime->currentTime = 0.0;
        runtime->nextEventIndex = 0;
        runtime->completedEvents = 0;
        LOG_INFO("[TimelineSystem] Loaded timeline with {} events (duration: {:.2f}s) on entity #{}.",
                 settings->events.size(), duration, timelineEntity);
    }

    void TimelineSystem::play(Registry &registry, EntityID timelineEntity)
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        if (!runtime) runtime = &registry.AddComponent<TimelineRuntimeComponent>(timelineEntity);

        runtime->state = TimelineState::Running;
        LOG_INFO("[TimelineSystem] Started timeline on entity #{}.", timelineEntity);
    }

    void TimelineSystem::pause(Registry &registry, EntityID timelineEntity)
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        if (runtime && runtime->state == TimelineState::Running)
        {
            runtime->state = TimelineState::Paused;
            LOG_INFO("[TimelineSystem] Paused timeline on entity #{}.", timelineEntity);
        }
    }

    void TimelineSystem::resume(Registry &registry, EntityID timelineEntity)
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        if (runtime && runtime->state == TimelineState::Paused)
        {
            runtime->state = TimelineState::Running;
            LOG_INFO("[TimelineSystem] Resumed timeline on entity #{}.", timelineEntity);
        }
    }

    void TimelineSystem::stop(Registry &registry, EntityID timelineEntity)
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        if (runtime)
        {
            runtime->state = TimelineState::Ready;
            runtime->currentTime = 0.0;
            runtime->nextEventIndex = 0;
            runtime->completedEvents = 0;
            LOG_INFO("[TimelineSystem] Stopped timeline on entity #{}.", timelineEntity);
        }
    }

    void TimelineSystem::seek(Registry &registry, EntityID timelineEntity, double targetTime)
    {
        auto *settings = registry.GetComponent<TimelineSettingsComponent>(timelineEntity);
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);

        if (!settings || !runtime) return;

        runtime->currentTime = std::clamp(targetTime, 0.0, settings->duration);
        runtime->nextEventIndex = 0;
        runtime->completedEvents = 0;

        for (size_t i = 0; i < settings->events.size(); ++i)
        {
            if (settings->events[i].timestamp <= runtime->currentTime)
            {
                runtime->nextEventIndex = static_cast<uint32_t>(i + 1);
                runtime->completedEvents = static_cast<uint32_t>(i + 1);
            }
            else
            {
                break;
            }
        }
        LOG_INFO("[TimelineSystem] Seeked timeline on entity #{} to {:.2f}s.", timelineEntity, runtime->currentTime);
    }

    void TimelineSystem::restart(Registry &registry, EntityID timelineEntity)
    {
        stop(registry, timelineEntity);
        play(registry, timelineEntity);
    }

    void TimelineSystem::Update(Registry &registry, double dt, const std::function<void(const TimelineEventData &event)> &onEventExecuted)
    {
        auto view = registry.GetView<TimelineSettingsComponent, TimelineRuntimeComponent>();
        for (auto entity : view)
        {
            auto *settings = registry.GetComponent<TimelineSettingsComponent>(entity);
            auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(entity);

            if (!settings || !runtime || runtime->state != TimelineState::Running) continue;

            runtime->currentTime += dt;
            runtime->currentTick++;

            while (runtime->nextEventIndex < settings->events.size())
            {
                const auto &evt = settings->events[runtime->nextEventIndex];
                if (evt.timestamp <= runtime->currentTime)
                {
                    runtime->lastExecutedEventID = evt.eventID;
                    runtime->completedEvents++;
                    runtime->nextEventIndex++;

                    LOG_INFO("[TimelineSystem] Executed event ID {} (time {:.2f}s) on entity #{}.",
                             evt.eventID, evt.timestamp, entity);

                    if (onEventExecuted)
                    {
                        onEventExecuted(evt);
                    }
                }
                else
                {
                    break;
                }
            }

            if (runtime->currentTime >= settings->duration)
            {
                if (settings->looping)
                {
                    restart(registry, entity);
                }
                else
                {
                    runtime->state = TimelineState::Completed;
                    LOG_INFO("[TimelineSystem] Completed timeline execution on entity #{}.", entity);
                }
            }
        }
    }

    double TimelineSystem::currentTime(Registry &registry, EntityID timelineEntity) const
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        return runtime ? runtime->currentTime : 0.0;
    }

    double TimelineSystem::remainingTime(Registry &registry, EntityID timelineEntity) const
    {
        auto *settings = registry.GetComponent<TimelineSettingsComponent>(timelineEntity);
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        if (settings && runtime)
        {
            return std::max(0.0, settings->duration - runtime->currentTime);
        }
        return 0.0;
    }

    uint32_t TimelineSystem::currentEvent(Registry &registry, EntityID timelineEntity) const
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        return runtime ? runtime->lastExecutedEventID : 0;
    }

    uint32_t TimelineSystem::completedEvents(Registry &registry, EntityID timelineEntity) const
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        return runtime ? runtime->completedEvents : 0;
    }

    TimelineState TimelineSystem::timelineState(Registry &registry, EntityID timelineEntity) const
    {
        auto *runtime = registry.GetComponent<TimelineRuntimeComponent>(timelineEntity);
        return runtime ? runtime->state : TimelineState::Created;
    }

    SubsystemProfilerMetrics TimelineSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Running";
        metrics.cpuTimeMs = 0.02;
        metrics.memoryUsageBytes = sizeof(TimelineRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
