#ifndef PLATFORM_ENGINE_GAMEPLAY_GAME_STATE_HPP
#define PLATFORM_ENGINE_GAMEPLAY_GAME_STATE_HPP

#include <cstdint>
#include <string>

namespace platform
{
    enum class MatchState : uint8_t
    {
        Boot = 0,
        Loading,
        Ready,
        Playing,
        Paused,
        Completed,
        Failed,
        Exiting,
        Respawning
    };

    struct GameStateMetrics
    {
        MatchState CurrentState{MatchState::Ready};
        float DistanceTravelled{0.0f}; // meters / units
        int ActivatedCheckpoints{0};
        int TotalCheckpoints{3};
        int RespawnCount{0};
        double FrameTimeMs{0.0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_GAME_STATE_HPP
