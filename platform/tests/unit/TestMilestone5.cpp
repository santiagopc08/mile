#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/vehicle/VehicleConfig.hpp"
#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/vehicle/powertrain/Powertrain.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/vehicle/VehicleDebugRenderer.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("VehicleFactory Creation and Attachment", "[Vehicle]")
{
    platform::Registry registry;
    platform::VehicleConfig vConfig;
    vConfig.Name = "Test Buggy";
    vConfig.Mass = 1100.0f;

    platform::EntityID vEntity = platform::VehicleFactory::CreateVehicle(registry, vConfig);

    REQUIRE(vEntity != platform::kNullEntity);
    REQUIRE(registry.IsAlive(vEntity));

    auto *vComp = registry.GetComponent<platform::VehicleComponent>(vEntity);
    REQUIRE(vComp != nullptr);
    REQUIRE(vComp->Config.Name == "Test Buggy");
    REQUIRE(vComp->WheelEntities.size() == 2);

    for (platform::EntityID wEntity : vComp->WheelEntities)
    {
        REQUIRE(registry.IsAlive(wEntity));
        REQUIRE(registry.HasComponent<platform::WheelComponent>(wEntity));
        REQUIRE(registry.HasComponent<platform::SuspensionComponent>(wEntity));
    }

    platform::VehicleFactory::DestroyVehicle(registry, vEntity);
    registry.FlushDestroyedEntities();

    REQUIRE_FALSE(registry.IsAlive(vEntity));
}

TEST_CASE("Powertrain Torque and RPM Calculation", "[Vehicle]")
{
    platform::Powertrain powertrain;
    platform::VehicleComponent vehicleComp;
    vehicleComp.Config.MaxMotorTorque = 500.0f;
    vehicleComp.Inputs.Throttle = 0.5f; // 50% throttle

    powertrain.Update(vehicleComp, 10.0f, 0.016);

    REQUIRE(powertrain.GetCurrentTorque() == Catch::Approx(250.0f));
    REQUIRE(powertrain.GetEngineRPM() > 800.0f);
}

TEST_CASE("VehicleController Action Translation", "[Vehicle]")
{
    platform::ActionMap map = platform::ActionMap::CreateDefault();
    platform::ActionContext context(map);

    std::unordered_map<platform::Key, platform::ButtonState> keys;
    keys[platform::Key::W] = platform::ButtonState::Held;   // Throttle
    keys[platform::Key::A] = platform::ButtonState::Pressed; // Steer Left

    std::unordered_map<platform::MouseButton, platform::ButtonState> buttons;
    auto snapshot = std::make_shared<platform::InputSnapshot>(
        keys, buttons, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f
    );
    context.Update(snapshot);

    platform::VehicleController controller;
    platform::VehicleComponent vehicleComp;

    controller.Update(vehicleComp, context);

    REQUIRE(vehicleComp.Inputs.Throttle == 1.0f);
    REQUIRE(vehicleComp.Inputs.Steering < 0.0f);
    REQUIRE(vehicleComp.Inputs.Brake == 0.0f);
}

TEST_CASE("VehiclePhysicsSystem Speed and Wheel Position Sync", "[Vehicle]")
{
    platform::Registry registry;
    platform::EntityID vEntity = platform::VehicleFactory::CreateVehicle(registry);

    platform::PhysicsWorld physicsWorld;
    platform::PhysicsConfig pConfig;
    physicsWorld.Initialize(pConfig);

    platform::ActionContext actionContext;
    platform::VehiclePhysicsSystem vSystem;

    vSystem.Update(registry, physicsWorld, actionContext, 0.016);

    auto *vComp = registry.GetComponent<platform::VehicleComponent>(vEntity);
    REQUIRE(vComp != nullptr);
    REQUIRE(vComp->State.GroundedWheelCount == 2);

    physicsWorld.Shutdown();
}

TEST_CASE("VehicleValidationScene Demo Execution", "[VehicleScene]")
{
    platform::VehicleValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);
    REQUIRE(scene.GetGroundEntity() != platform::kNullEntity);

    scene.Update(0.016);
    scene.Deactivate();
    scene.Shutdown();
}
