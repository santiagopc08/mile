#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/graphics/components/SpriteComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/RenderSystem.hpp"
#include "engine/input/actions/ActionMap.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "examples/hill_climb/FirstPlayableScene.hpp"

TEST_CASE("Render Component Attachment and Initialization", "[Graphics]")
{
    platform::SpriteComponent sprite;
    REQUIRE(sprite.TextureHandle == 0);
    REQUIRE(sprite.TintColor.a == 1.0f);

    platform::ShapeComponent shape;
    REQUIRE(shape.Type == platform::ShapeType::Rectangle);
    REQUIRE(shape.Size.x == 64.0f);
    REQUIRE(shape.Size.y == 64.0f);
    REQUIRE(shape.Filled);

    platform::RenderLayerComponent layer;
    REQUIRE(layer.LayerID == 0);
    REQUIRE(layer.OrderInLayer == 0);

    platform::VisibilityComponent vis;
    REQUIRE(vis.Visible);
}

TEST_CASE("CameraManager Active Camera Management", "[Camera]")
{
    platform::CameraManager manager;
    REQUIRE_FALSE(manager.HasActiveCamera());

    auto *cam1 = manager.CreateCamera(1280.0f, 720.0f);
    REQUIRE(manager.HasActiveCamera());
    REQUIRE(manager.GetActiveCamera() == cam1);

    auto *cam2 = manager.CreateCamera(1920.0f, 1080.0f);
    manager.SetActiveCamera(cam2);
    REQUIRE(manager.GetActiveCamera() == cam2);

    manager.DestroyCamera(cam2);
    REQUIRE(manager.GetActiveCamera() == cam1);
}

TEST_CASE("Runtime Input Action System Evaluation", "[InputActions]")
{
    platform::ActionMap map = platform::ActionMap::CreateDefault();
    platform::ActionContext context(map);

    // Simulated input state with W (MoveUp) and D (MoveRight) pressed
    std::unordered_map<platform::Key, platform::ButtonState> keys;
    keys[platform::Key::W] = platform::ButtonState::Pressed;
    keys[platform::Key::D] = platform::ButtonState::Held;

    std::unordered_map<platform::MouseButton, platform::ButtonState> buttons;
    auto snapshot = std::make_shared<platform::InputSnapshot>(
        keys, buttons, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f
    );

    context.Update(snapshot);

    REQUIRE(context.IsActionTriggered(platform::InputAction::MoveUp));
    REQUIRE(context.IsActionHeld(platform::InputAction::MoveRight));
    REQUIRE_FALSE(context.IsActionHeld(platform::InputAction::MoveLeft));

    glm::vec2 move = context.GetMovementVector();
    REQUIRE(move.x > 0.0f);
    REQUIRE(move.y < 0.0f); // Up moves Y negative in screen/world convention
}

TEST_CASE("RenderSystem Sorting and Queue Building", "[RenderPipeline]")
{
    platform::Registry registry;
    platform::Camera2D camera(1280.0f, 720.0f);

    platform::EntityID e1 = registry.CreateEntity("Entity1");
    platform::EntityID e2 = registry.CreateEntity("Entity2");

    auto &t1 = registry.AddComponent<platform::TransformComponent>(e1);
    t1.SetPosition({-50.0f, 0.0f});
    auto &s1 = registry.AddComponent<platform::ShapeComponent>(e1);
    s1.Size = {32.0f, 32.0f};

    auto &l1 = registry.AddComponent<platform::RenderLayerComponent>(e1);
    l1.LayerID = 1;

    auto &t2 = registry.AddComponent<platform::TransformComponent>(e2);
    t2.SetPosition({50.0f, 0.0f});
    auto &s2 = registry.AddComponent<platform::ShapeComponent>(e2);
    s2.Size = {64.0f, 64.0f};

    auto &l2 = registry.AddComponent<platform::RenderLayerComponent>(e2);
    l2.LayerID = 0;

    platform::Renderer renderer; // Dummy for command submission in headless test
    platform::RenderSystem renderSystem;

    // Headless test does not call presentation, only tests Queue Building and Sorting
    renderSystem.RenderScene(registry, renderer, camera);
    REQUIRE(renderSystem.GetRenderedItemCount() == 2);
}

TEST_CASE("FirstPlayableScene Integration", "[InteractiveScene]")
{
    platform::FirstPlayableScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetPlayerEntity() != platform::kNullEntity);

    scene.Update(0.016);
    scene.PrepareRender();

    scene.Deactivate();
    scene.Shutdown();
    REQUIRE_FALSE(scene.IsActive());
}
