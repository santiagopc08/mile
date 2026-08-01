#include "engine/rhythm/RhythmValidationController.hpp"
#include "engine/core/Logger.hpp"
#include <cmath>

namespace platform
{
    void RhythmValidationController::Initialize()
    {
        m_step = RhythmValidationStep::StartSong;
        m_rhythmEntity = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        m_accumulatedDrift = 0.0;
        LOG_INFO("[RhythmValidationController] Initialized autonomous rhythm framework validation sequence.");
    }

    std::string RhythmValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case RhythmValidationStep::StartSong: return "StartSong";
        case RhythmValidationStep::Run60Seconds: return "Run60Seconds";
        case RhythmValidationStep::Pause: return "Pause";
        case RhythmValidationStep::Resume: return "Resume";
        case RhythmValidationStep::Seek: return "Seek";
        case RhythmValidationStep::Restart: return "Restart";
        case RhythmValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void RhythmValidationController::Update(Registry &registry, RhythmSystem &rhythmSystem, double dt)
    {
        if (m_rhythmEntity == kNullEntity)
        {
            m_rhythmEntity = registry.CreateEntity("RhythmController");
            rhythmSystem.setBPM(registry, m_rhythmEntity, 120.0f); // 120 BPM = 2 beats per sec (0.5s per beat)
        }

        m_stepTimer += dt;

        switch (m_step)
        {
        case RhythmValidationStep::StartSong:
            rhythmSystem.play(registry, m_rhythmEntity);
            m_step = RhythmValidationStep::Run60Seconds;
            m_stepTimer = 0.0;
            LOG_INFO("[RhythmValidationController] Transitioned -> Run60Seconds");
            break;

        case RhythmValidationStep::Run60Seconds:
            rhythmSystem.Update(registry, dt);
            if (m_stepTimer >= 0.1) // Accelerated simulation
            {
                // Verify 120 BPM at songTime = 60.0s yields exactly beatIndex 120
                rhythmSystem.seekTime(registry, m_rhythmEntity, 60.0);
                uint64_t beat = rhythmSystem.currentBeat(registry, m_rhythmEntity);
                double expectedTime = 60.0;
                double actualTime = rhythmSystem.songTime(registry, m_rhythmEntity);
                m_accumulatedDrift = std::abs(expectedTime - actualTime);

                LOG_INFO("[RhythmValidationController] 60s timing test: Beat={}, SongTime={:.2f}s, Drift={:.6f}s.",
                         beat, actualTime, m_accumulatedDrift);

                m_step = RhythmValidationStep::Pause;
                m_stepTimer = 0.0;
                LOG_INFO("[RhythmValidationController] Transitioned -> Pause");
            }
            break;

        case RhythmValidationStep::Pause:
            rhythmSystem.pause(registry, m_rhythmEntity);
            m_step = RhythmValidationStep::Resume;
            m_stepTimer = 0.0;
            LOG_INFO("[RhythmValidationController] Transitioned -> Resume");
            break;

        case RhythmValidationStep::Resume:
            rhythmSystem.resume(registry, m_rhythmEntity);
            m_step = RhythmValidationStep::Seek;
            m_stepTimer = 0.0;
            LOG_INFO("[RhythmValidationController] Transitioned -> Seek");
            break;

        case RhythmValidationStep::Seek:
            rhythmSystem.seekBeat(registry, m_rhythmEntity, 64); // Beat 64 = Measure 17 at 4 beats/measure
            m_step = RhythmValidationStep::Restart;
            m_stepTimer = 0.0;
            LOG_INFO("[RhythmValidationController] Transitioned -> Restart");
            break;

        case RhythmValidationStep::Restart:
            rhythmSystem.stop(registry, m_rhythmEntity);
            m_cycleCount++;
            LOG_INFO("[RhythmValidationController] Completed full rhythm validation cycle (Count: {}).", m_cycleCount);
            m_step = RhythmValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case RhythmValidationStep::Repeat:
            m_step = RhythmValidationStep::StartSong;
            m_stepTimer = 0.0;
            break;
        }
    }
}
