#ifndef PLATFORM_EXAMPLES_ARCADE_TURBO_RACE_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_TURBO_RACE_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <vector>

namespace platform::arcade
{
    class TurboRaceScene final : public ArcadeScene
    {
    public:
        explicit TurboRaceScene(ArcadeSession *session);

        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        enum class State
        {
            Ready,
            Racing,
            GameOver,
        };

        enum class VehicleType
        {
            Sedan,
            Truck,
            Supercar,
        };

        enum class PickupType
        {
            Coin,
            Fuel,
            Nitro,
            Shield,
        };

        struct TrafficCar
        {
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Size{36.0f, 70.0f};
            float Speed{220.0f};
            VehicleType Type{VehicleType::Sedan};
            glm::vec4 Color{Palette::Amber};
            bool Active{false};
            bool Grazed{false};
        };

        struct Pickup
        {
            glm::vec2 Position{0.0f, 0.0f};
            PickupType Type{PickupType::Coin};
            bool Active{false};
        };

        static constexpr float kRoadWidth = 460.0f;
        static constexpr float kRoadLeft = (kScreenWidth - kRoadWidth) * 0.5f;
        static constexpr float kRoadRight = kRoadLeft + kRoadWidth;
        static constexpr int kLaneCount = 4;

        void ResetGame();
        void SpawnTraffic();
        void SpawnPickup();
        void UpdatePhysics(float dt);
        void CheckCollisions();

        State m_state{State::Ready};

        glm::vec2 m_playerPos{kScreenWidth * 0.5f, kScreenHeight - 140.0f};
        glm::vec2 m_playerVel{0.0f, 0.0f};
        float m_speed{180.0f};      // km/h or relative speed units
        float m_maxSpeed{420.0f};
        float m_distance{0.0f};
        float m_fuel{100.0f};
        float m_nitroTimer{0.0f};
        float m_shieldTimer{0.0f};
        int m_score{0};
        int m_highScore{0};
        int m_overtakes{0};

        float m_roadScrollOffset{0.0f};
        float m_trafficSpawnTimer{0.0f};
        float m_pickupSpawnTimer{0.0f};

        std::vector<TrafficCar> m_traffic;
        std::vector<Pickup> m_pickups;

        ParticleField m_particles;
        Random m_random{0x5A17EEDu};

        bool m_spaceLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_TURBO_RACE_SCENE_HPP
