#include "examples/hill_climb/NativeHillClimbScene.hpp"

#include "engine/graphics/RenderCommand.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/Components.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform
{
    namespace
    {
        // World space is Y-down (screen convention), so a smaller Y means higher terrain.
        constexpr float kGroundBaseY = 420.0f;
        constexpr float kChassisWidth = 112.0f;
        constexpr float kChassisHeight = 32.0f;
        constexpr float kWheelRadius = 17.0f;
        constexpr float kAxleOffsetX = 38.0f;
        constexpr float kRideHeight = 34.0f;
        constexpr float kMaxSpeed = 540.0f;
        constexpr float kMaxReverseSpeed = 280.0f;
        constexpr float kGravity = 1500.0f;

        // Drive forces, in units/s^2 along the slope. The engine has to out-pull
        // gravity on the steepest hill (~31 degrees, so ~0.52 g) or the buggy can
        // never climb out of a valley.
        constexpr float kEngineAccel = 980.0f;
        constexpr float kBrakeAccel = 1150.0f;
        constexpr float kSlopeGravity = 1000.0f;
        constexpr float kRollingDrag = 1.7f;
        constexpr float kAirDrag = 0.12f;
        constexpr float kFuelCanSpacing = 1400.0f;
        constexpr int kFuelCanCount = 12;

        std::string FormatLine(const char *format, float a, float b = 0.0f)
        {
            char buffer[160];
            std::snprintf(buffer, sizeof(buffer), format, static_cast<double>(a), static_cast<double>(b));
            return std::string(buffer);
        }
    }

    NativeHillClimbScene::NativeHillClimbScene()
        : Scene("Hill Climb Native")
    {
    }

    float NativeHillClimbScene::GroundHeightAt(float x)
    {
        // Three octaves of sine give rolling hills with a long, slow swell underneath.
        return kGroundBaseY
            - std::sin(x * 0.0032f) * 96.0f
            - std::sin(x * 0.0091f) * 42.0f
            - std::sin(x * 0.0007f) * 130.0f;
    }

    float NativeHillClimbScene::GroundSlopeAt(float x)
    {
        // Analytic derivative of GroundHeightAt: dy/dx of the terrain profile.
        return -std::cos(x * 0.0032f) * 96.0f * 0.0032f
            - std::cos(x * 0.0091f) * 42.0f * 0.0091f
            - std::cos(x * 0.0007f) * 130.0f * 0.0007f;
    }

    EntityID NativeHillClimbScene::CreateBlock(const glm::vec2 &position, const glm::vec2 &size, const glm::vec4 &color, int layer)
    {
        const EntityID entity = CreateEntity("Terrain");

        auto &transform = GetRegistry().AddComponent<TransformComponent>(entity);
        transform.Position = position;
        transform.Scale = {1.0f, 1.0f};

        auto &shape = GetRegistry().AddComponent<ShapeComponent>(entity);
        shape.Size = size;
        shape.Color = color;

        GetRegistry().AddComponent<RenderLayerComponent>(entity).LayerID = layer;
        GetRegistry().AddComponent<VisibilityComponent>(entity);
        return entity;
    }

    void NativeHillClimbScene::BuildTerrain()
    {
        m_terrain.clear();
        m_terrain.reserve(kVisibleSlices);

        for (int i = 0; i < kVisibleSlices; ++i)
        {
            TerrainSlice slice;
            slice.Index = i;
            // Dirt body reaches well below the surface so the fill never shows a seam.
            slice.Body = CreateBlock({0.0f, 0.0f}, {kSliceWidth + 1.0f, 1600.0f}, {0.09f, 0.22f, 0.17f, 1.0f}, 0);
            slice.Surface = CreateBlock({0.0f, 0.0f}, {kSliceWidth + 6.0f, 16.0f}, {0.38f, 0.84f, 0.43f, 1.0f}, 1);
            m_terrain.push_back(slice);
        }

        m_firstSliceIndex = 0;
        UpdateTerrainStreaming();
    }

    void NativeHillClimbScene::UpdateTerrainStreaming()
    {
        // Slices are recycled around the camera, so the road is effectively endless
        // while the entity count stays constant.
        const int centerSlice = static_cast<int>(std::floor(m_distance / kSliceWidth));
        m_firstSliceIndex = centerSlice - (kVisibleSlices / 3);

        for (int i = 0; i < static_cast<int>(m_terrain.size()); ++i)
        {
            const int sliceIndex = m_firstSliceIndex + i;
            const float x = static_cast<float>(sliceIndex) * kSliceWidth;
            const float groundY = GroundHeightAt(x);

            // Tilting each surface slice to the local slope turns the strip into a
            // continuous ribbon instead of a staircase.
            const float slopeDegrees = std::atan(GroundSlopeAt(x)) * 57.2957795f;

            auto *surface = GetRegistry().GetComponent<TransformComponent>(m_terrain[i].Surface);
            surface->Position = {x, groundY};
            surface->Rotation = slopeDegrees;

            // The dirt body starts a little under the ribbon so tilting never
            // exposes the sky behind a steep seam.
            GetRegistry().GetComponent<TransformComponent>(m_terrain[i].Body)->Position = {x, groundY + 790.0f};
        }
    }

    void NativeHillClimbScene::OnInitialize()
    {
        m_camera.SetZoom(1.0f);

        // Sky backdrop: two wide bands that always sit behind the terrain.
        CreateBlock({0.0f, 0.0f}, {60000.0f, 4000.0f}, {0.05f, 0.08f, 0.14f, 1.0f}, -3);

        BuildTerrain();

        for (int i = 0; i < kFuelCanCount; ++i)
        {
            const float x = 900.0f + static_cast<float>(i) * kFuelCanSpacing;
            m_fuelCanX.push_back(x);
            m_fuelCans.push_back(CreateBlock({x, GroundHeightAt(x) - 40.0f}, {20.0f, 30.0f}, {0.98f, 0.78f, 0.22f, 1.0f}, 2));
        }

        m_chassis = CreateEntity("Buggy Chassis");
        GetRegistry().AddComponent<TransformComponent>(m_chassis);
        auto &chassisShape = GetRegistry().AddComponent<ShapeComponent>(m_chassis);
        chassisShape.Size = {kChassisWidth, kChassisHeight};
        chassisShape.Color = {0.97f, 0.43f, 0.15f, 1.0f};
        GetRegistry().AddComponent<RenderLayerComponent>(m_chassis).LayerID = 4;
        GetRegistry().AddComponent<VisibilityComponent>(m_chassis);

        m_rearWheel = CreateEntity("Rear Wheel");
        m_frontWheel = CreateEntity("Front Wheel");
        for (const auto wheel : {m_rearWheel, m_frontWheel})
        {
            GetRegistry().AddComponent<TransformComponent>(wheel);
            auto &shape = GetRegistry().AddComponent<ShapeComponent>(wheel);
            shape.Type = ShapeType::Circle;
            shape.Radius = kWheelRadius;
            shape.Size = {kWheelRadius * 2.0f, kWheelRadius * 2.0f};
            shape.Color = {0.09f, 0.10f, 0.13f, 1.0f};
            GetRegistry().AddComponent<RenderLayerComponent>(wheel).LayerID = 5;
            GetRegistry().AddComponent<VisibilityComponent>(wheel);
        }

        Restart();
    }

    void NativeHillClimbScene::Restart()
    {
        m_distance = 0.0f;
        m_speed = 0.0f;
        m_fuel = 100.0f;
        m_verticalVelocity = 0.0f;
        m_airborneTime = 0.0f;
        m_wheelSpin = 0.0f;
        m_chassisY = GroundHeightAt(0.0f) - kRideHeight;
        m_chassisAngle = 0.0f;

        for (size_t i = 0; i < m_fuelCans.size(); ++i)
        {
            GetRegistry().GetComponent<VisibilityComponent>(m_fuelCans[i])->Visible = true;
            GetRegistry().GetComponent<TransformComponent>(m_fuelCans[i])->Position =
                {m_fuelCanX[i], GroundHeightAt(m_fuelCanX[i]) - 40.0f};
        }

        UpdateTerrainStreaming();
    }

    void NativeHillClimbScene::OnUpdate(double dt)
    {
        const float step = std::min(0.05f, static_cast<float>(dt)); // clamp long frames

        if (m_input)
        {
            m_actions.Update(m_input->CreateSnapshot());

            const bool restartDown = m_input->IsKeyPressed(Key::R) || m_input->IsKeyHeld(Key::R);
            if (restartDown && !m_restartLatch)
            {
                Restart();
                m_restartLatch = true;
                return;
            }
            m_restartLatch = restartDown;
        }

        const bool hasFuel = m_fuel > 0.0f;
        const float throttle = (m_actions.IsActionHeld(InputAction::MoveRight) && hasFuel) ? 1.0f : 0.0f;
        const float brake = m_actions.IsActionHeld(InputAction::MoveLeft) ? 1.0f : 0.0f;

        const float slope = GroundSlopeAt(m_distance);
        const bool grounded = m_airborneTime <= 0.0f;

        float acceleration = 0.0f;
        if (grounded)
        {
            acceleration += throttle * kEngineAccel;
            acceleration -= brake * kBrakeAccel;

            // A positive slope means the ground falls away ahead (Y grows downward),
            // so the buggy is pulled forward downhill and held back uphill. Using
            // sin(atan(slope)) keeps steep sections from exploding the force.
            acceleration += kSlopeGravity * std::sin(std::atan(slope));
            acceleration -= m_speed * kRollingDrag;
        }
        else
        {
            acceleration -= m_speed * kAirDrag;
        }

        m_speed = std::clamp(m_speed + acceleration * step, -kMaxReverseSpeed, kMaxSpeed);
        m_distance += m_speed * step;

        m_bestDistance = std::max(m_bestDistance, m_distance);

        if (throttle > 0.0f)
        {
            m_fuel = std::max(0.0f, m_fuel - step * 3.4f);
        }

        // Vertical motion: ride the terrain while grounded, fall ballistically once a
        // crest throws the buggy into the air.
        const float groundY = GroundHeightAt(m_distance);
        const float restY = groundY - kRideHeight;

        m_verticalVelocity += kGravity * step;
        m_chassisY += m_verticalVelocity * step;

        if (m_chassisY >= restY)
        {
            m_chassisY = restY;
            m_verticalVelocity = 0.0f;
            m_airborneTime = 0.0f;
        }
        else
        {
            m_airborneTime += step;
        }

        // Sample the terrain under each axle so the chassis tilts with the ground.
        const float rearY = GroundHeightAt(m_distance - kAxleOffsetX);
        const float frontY = GroundHeightAt(m_distance + kAxleOffsetX);
        const float targetAngle = std::atan2(frontY - rearY, kAxleOffsetX * 2.0f) * 57.2957795f;
        const float angleBlend = std::min(1.0f, step * (m_airborneTime > 0.0f ? 2.0f : 12.0f));
        m_chassisAngle += (targetAngle - m_chassisAngle) * angleBlend;

        m_wheelSpin += m_speed * step * 1.6f;

        const float radians = m_chassisAngle * 0.01745329252f;
        const float cosA = std::cos(radians);
        const float sinA = std::sin(radians);

        auto *chassisTransform = GetRegistry().GetComponent<TransformComponent>(m_chassis);
        chassisTransform->Position = {m_distance, m_chassisY};
        chassisTransform->Rotation = m_chassisAngle;

        auto *rearTransform = GetRegistry().GetComponent<TransformComponent>(m_rearWheel);
        rearTransform->Position = {
            m_distance - kAxleOffsetX * cosA,
            m_chassisY - kAxleOffsetX * sinA + kRideHeight - kWheelRadius,
        };
        rearTransform->Rotation = m_wheelSpin;

        auto *frontTransform = GetRegistry().GetComponent<TransformComponent>(m_frontWheel);
        frontTransform->Position = {
            m_distance + kAxleOffsetX * cosA,
            m_chassisY + kAxleOffsetX * sinA + kRideHeight - kWheelRadius,
        };
        frontTransform->Rotation = m_wheelSpin;

        for (size_t i = 0; i < m_fuelCans.size(); ++i)
        {
            auto *visibility = GetRegistry().GetComponent<VisibilityComponent>(m_fuelCans[i]);
            if (!visibility->Visible)
            {
                continue;
            }
            if (std::abs(m_fuelCanX[i] - m_distance) < 45.0f && std::abs(m_chassisY - (GroundHeightAt(m_fuelCanX[i]) - 40.0f)) < 90.0f)
            {
                visibility->Visible = false;
                m_fuel = std::min(100.0f, m_fuel + 45.0f);
            }
        }

        UpdateTerrainStreaming();

        // The camera leads slightly in the travel direction and eases vertically.
        const glm::vec2 cameraTarget{m_distance + m_speed * 0.35f, m_chassisY - 40.0f};
        const glm::vec2 cameraPos = m_camera.GetPosition();
        m_camera.SetPosition(cameraPos + (cameraTarget - cameraPos) * std::min(1.0f, step * 6.0f));
    }

    void NativeHillClimbScene::OnRender(Renderer &renderer)
    {
        const glm::vec4 heading{0.72f, 0.94f, 0.86f, 1.0f};
        const glm::vec4 body{0.80f, 0.86f, 0.92f, 1.0f};
        const glm::vec4 muted{0.55f, 0.66f, 0.74f, 1.0f};

        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2{240.0f, 62.0f}, glm::vec2{440.0f, 108.0f}, 0.0f, glm::vec4{0.03f, 0.05f, 0.08f, 0.82f}));

        renderer.SubmitCommand(std::make_unique<DrawTextCommand>(
            glm::vec2{40.0f, 26.0f}, "HILL CLIMB NATIVE", heading, 2.0f));
        renderer.SubmitCommand(std::make_unique<DrawTextCommand>(
            glm::vec2{40.0f, 56.0f}, FormatLine("DISTANCE %.0f m    SPEED %.0f", m_distance / 10.0f, std::abs(m_speed) / 10.0f), body, 1.5f));
        renderer.SubmitCommand(std::make_unique<DrawTextCommand>(
            glm::vec2{40.0f, 80.0f}, FormatLine("BEST %.0f m", m_bestDistance / 10.0f), muted, 1.5f));

        // Fuel gauge.
        const float gaugeWidth = 260.0f;
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2{40.0f + gaugeWidth * 0.5f, 112.0f}, glm::vec2{gaugeWidth, 14.0f}, 0.0f, glm::vec4{0.12f, 0.15f, 0.19f, 1.0f}));
        const float fuelRatio = std::clamp(m_fuel / 100.0f, 0.0f, 1.0f);
        const glm::vec4 fuelColor = fuelRatio > 0.25f
            ? glm::vec4{0.36f, 0.83f, 0.52f, 1.0f}
            : glm::vec4{0.93f, 0.36f, 0.32f, 1.0f};
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2{40.0f + gaugeWidth * fuelRatio * 0.5f, 112.0f}, glm::vec2{gaugeWidth * fuelRatio, 14.0f}, 0.0f, fuelColor));
        renderer.SubmitCommand(std::make_unique<DrawTextCommand>(
            glm::vec2{40.0f + gaugeWidth + 12.0f, 106.0f}, "FUEL", muted, 1.5f));

        renderer.SubmitCommand(std::make_unique<DrawTextCommand>(
            glm::vec2{40.0f, 660.0f}, "D / RIGHT ACCELERATE     A / LEFT BRAKE-REVERSE     R RESTART     ESC QUIT", muted, 1.5f));

        if (m_fuel <= 0.0f)
        {
            renderer.SubmitCommand(std::make_unique<DrawTextCommand>(
                glm::vec2{460.0f, 320.0f}, "OUT OF FUEL  -  PRESS R", glm::vec4{0.95f, 0.55f, 0.35f, 1.0f}, 3.0f));
        }
    }
}
