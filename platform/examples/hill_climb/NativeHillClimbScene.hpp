#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_NATIVE_HILL_CLIMB_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_NATIVE_HILL_CLIMB_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "engine/input/Input.hpp"
#include "engine/input/actions/ActionContext.hpp"

#include <vector>

namespace platform
{
    class NativeHillClimbScene final : public Scene
    {
    public:
        NativeHillClimbScene();

        void BindInput(Input *input) { m_input = input; }
        [[nodiscard]] Camera2D *GetActiveCamera() override { return &m_camera; }

        /// Terrain profile in world space. Shared by the terrain mesh, the buggy and
        /// the camera so everything agrees on where the ground is.
        [[nodiscard]] static float GroundHeightAt(float x);
        [[nodiscard]] static float GroundSlopeAt(float x);

        /// Exposed for validation: current run state.
        [[nodiscard]] float GetDistance() const { return m_distance; }
        [[nodiscard]] float GetSpeed() const { return m_speed; }
        [[nodiscard]] float GetFuel() const { return m_fuel; }
        [[nodiscard]] bool IsOutOfFuel() const { return m_fuel <= 0.0f; }

        void Restart();

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        EntityID CreateBlock(const glm::vec2 &position, const glm::vec2 &size, const glm::vec4 &color, int layer = 0);
        void BuildTerrain();
        void UpdateTerrainStreaming();

        struct TerrainSlice
        {
            EntityID Surface{kNullEntity};
            EntityID Body{kNullEntity};
            int Index{0};
        };

        static constexpr float kSliceWidth = 18.0f;
        static constexpr int kVisibleSlices = 130;

        Camera2D m_camera{1280.0f, 720.0f};
        ActionContext m_actions;
        Input *m_input{nullptr};

        EntityID m_chassis{kNullEntity};
        EntityID m_frontWheel{kNullEntity};
        EntityID m_rearWheel{kNullEntity};
        std::vector<TerrainSlice> m_terrain;
        std::vector<EntityID> m_fuelCans;
        std::vector<float> m_fuelCanX;

        int m_firstSliceIndex{0};
        float m_speed{0.0f};
        float m_distance{0.0f};
        float m_bestDistance{0.0f};
        float m_fuel{100.0f};
        float m_airborneTime{0.0f};
        float m_verticalVelocity{0.0f};
        float m_chassisY{0.0f};
        float m_chassisAngle{0.0f};
        float m_wheelSpin{0.0f};
        bool m_restartLatch{false};
    };
}

#endif
