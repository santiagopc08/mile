#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "editor/app/EditorContext.hpp"
#include "editor/commands/EntityCommands.hpp"
#include "editor/io/SceneSerializer.hpp"
#include "editor/panels/ScenePanel.hpp"
#include "editor/ui/EditorMenuBar.hpp"
#include "editor/ui/EditorUI.hpp"
#include "editor/workspace/EditorWorkspace.hpp"
#include "engine/input/Input.hpp"
#include "examples/hill_climb/NativeHillClimbScene.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/Components.hpp"

#include <cmath>
#include <cstdio>
#include <filesystem>

namespace
{
    platform::EntityID MakeShape(platform::Scene &scene, const std::string &name, const glm::vec2 &position,
                                 const glm::vec2 &size, int layer)
    {
        auto &registry = scene.GetRegistry();
        const platform::EntityID entity = registry.CreateEntity(name);
        registry.AddComponent<platform::TransformComponent>(entity).Position = position;
        auto &shape = registry.AddComponent<platform::ShapeComponent>(entity);
        shape.Size = size;
        shape.Color = {0.2f, 0.4f, 0.8f, 1.0f};
        registry.AddComponent<platform::RenderLayerComponent>(entity).LayerID = layer;
        registry.AddComponent<platform::VisibilityComponent>(entity);
        return entity;
    }
}

TEST_CASE("Native Hill Climb scene builds a drivable world", "[HillClimb]")
{
    platform::NativeHillClimbScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    auto &registry = scene.GetRegistry();
    REQUIRE(registry.EntityCount() > 0);

    // Every drawable entity must carry a transform: the crash that stopped the game
    // on launch was a missing TransformComponent being dereferenced.
    for (platform::EntityID entity : registry.GetAliveEntities())
    {
        if (registry.HasComponent<platform::ShapeComponent>(entity))
        {
            REQUIRE(registry.GetComponent<platform::TransformComponent>(entity) != nullptr);
        }
    }
}

TEST_CASE("Hill Climb terrain and buggy agree on the ground line", "[HillClimb]")
{
    // The buggy rests on the surface the terrain mesh is built from.
    for (float x = -400.0f; x <= 2000.0f; x += 137.0f)
    {
        const float height = platform::NativeHillClimbScene::GroundHeightAt(x);
        REQUIRE(std::isfinite(height));

        // Numerical derivative must match the analytic slope used by the physics.
        constexpr float epsilon = 0.5f;
        const float numeric = (platform::NativeHillClimbScene::GroundHeightAt(x + epsilon)
                               - platform::NativeHillClimbScene::GroundHeightAt(x - epsilon))
            / (2.0f * epsilon);
        REQUIRE(numeric == Catch::Approx(platform::NativeHillClimbScene::GroundSlopeAt(x)).margin(0.01));
    }
}

TEST_CASE("Hill Climb simulation advances and restarts", "[HillClimb]")
{
    platform::NativeHillClimbScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    // Without input the buggy only rolls with gravity; it must stay finite and bounded.
    for (int i = 0; i < 120; ++i)
    {
        scene.Update(1.0 / 60.0);
    }
    REQUIRE(std::isfinite(scene.GetDistance()));
    REQUIRE(std::isfinite(scene.GetSpeed()));
    REQUIRE(scene.GetDistance() >= 0.0f);
    REQUIRE(scene.GetFuel() == Catch::Approx(100.0f)); // no throttle, no burn

    scene.Restart();
    REQUIRE(scene.GetDistance() == Catch::Approx(0.0f));
    REQUIRE(scene.GetSpeed() == Catch::Approx(0.0f));
    REQUIRE(scene.GetFuel() == Catch::Approx(100.0f));
    REQUIRE(!scene.IsOutOfFuel());
}

TEST_CASE("Hill Climb responds to the throttle and brake keys", "[HillClimb]")
{
    platform::Input input;
    input.Initialize();

    platform::NativeHillClimbScene scene;
    scene.BindInput(&input);
    REQUIRE(scene.Initialize());
    scene.Activate();

    // Hold D: the buggy must accelerate forward.
    input.OnKeyDown(platform::Key::D);
    for (int i = 0; i < 60; ++i)
    {
        scene.Update(1.0 / 60.0);
        input.NewFrame(); // key stays down, Pressed -> Held
    }

    const float drivenDistance = scene.GetDistance();
    INFO("distance after 1s of throttle: " << drivenDistance);
    REQUIRE(drivenDistance > 20.0f);
    REQUIRE(scene.GetSpeed() > 0.0f);
    REQUIRE(scene.GetFuel() < 100.0f); // throttle burns fuel

    // Release D, hold A: the buggy must slow down and reverse.
    input.OnKeyUp(platform::Key::D);
    input.NewFrame();
    input.OnKeyDown(platform::Key::A);
    for (int i = 0; i < 90; ++i)
    {
        scene.Update(1.0 / 60.0);
        input.NewFrame();
    }
    REQUIRE(scene.GetSpeed() < 0.0f);

    // The arrow keys are bound to the same actions.
    scene.Restart();
    input.OnKeyUp(platform::Key::A);
    input.NewFrame();
    input.OnKeyDown(platform::Key::Right);
    for (int i = 0; i < 60; ++i)
    {
        scene.Update(1.0 / 60.0);
        input.NewFrame();
    }
    REQUIRE(scene.GetDistance() > 20.0f);
}

TEST_CASE("Scene viewport picks the topmost entity under the cursor", "[Editor]")
{
    platform::EditorContext context;
    platform::Scene scene("Pick Scene");
    context.ActiveScene = &scene;

    MakeShape(scene, "Background", {0.0f, 0.0f}, {400.0f, 400.0f}, 0);
    const platform::EntityID foreground = MakeShape(scene, "Foreground", {0.0f, 0.0f}, {80.0f, 80.0f}, 5);

    // Inside both shapes: the higher render layer wins.
    REQUIRE(platform::ScenePanel::PickEntity(context, {10.0f, 10.0f}) == foreground);

    // Inside only the background.
    const platform::EntityID hit = platform::ScenePanel::PickEntity(context, {150.0f, 150.0f});
    REQUIRE(hit != platform::kNullEntity);
    REQUIRE(hit != foreground);

    // Outside everything.
    REQUIRE(platform::ScenePanel::PickEntity(context, {5000.0f, 5000.0f}) == platform::kNullEntity);
}

TEST_CASE("Duplicate and delete commands round-trip entity components", "[Editor]")
{
    platform::Scene scene("Command Scene");
    const platform::EntityID original = MakeShape(scene, "Crate", {120.0f, -40.0f}, {64.0f, 32.0f}, 3);
    scene.GetRegistry().GetComponent<platform::TransformComponent>(original)->Rotation = 45.0f;

    platform::DuplicateEntityCommand duplicate(&scene, original);
    REQUIRE(duplicate.Execute());

    const platform::EntityID copy = duplicate.GetCreatedEntity();
    REQUIRE(copy != platform::kNullEntity);
    REQUIRE(copy != original);
    REQUIRE(scene.GetRegistry().EntityCount() == 2);

    const auto *copyTransform = scene.GetRegistry().GetComponent<platform::TransformComponent>(copy);
    REQUIRE(copyTransform != nullptr);
    REQUIRE(copyTransform->Rotation == Catch::Approx(45.0f));
    REQUIRE(copyTransform->Position.x == Catch::Approx(160.0f)); // offset so it is visible
    REQUIRE(scene.GetRegistry().GetComponent<platform::ShapeComponent>(copy)->Size.x == Catch::Approx(64.0f));

    REQUIRE(duplicate.Undo());
    REQUIRE(scene.GetRegistry().EntityCount() == 1);

    // Deleting and undoing restores the components, not just the name.
    platform::DeleteEntityCommand remove(&scene, original);
    REQUIRE(remove.Execute());
    REQUIRE(scene.GetRegistry().EntityCount() == 0);

    REQUIRE(remove.Undo());
    REQUIRE(scene.GetRegistry().EntityCount() == 1);

    const platform::EntityID restored = scene.GetRegistry().GetAliveEntities().front();
    const auto *restoredTransform = scene.GetRegistry().GetComponent<platform::TransformComponent>(restored);
    REQUIRE(restoredTransform != nullptr);
    REQUIRE(restoredTransform->Position.x == Catch::Approx(120.0f));
    REQUIRE(restoredTransform->Rotation == Catch::Approx(45.0f));
    REQUIRE(scene.GetRegistry().GetComponent<platform::ShapeComponent>(restored) != nullptr);
    REQUIRE(scene.GetRegistry().GetComponent<platform::NameComponent>(restored)->Name == "Crate");
}

TEST_CASE("Editor scenes survive a save and load round-trip", "[Editor]")
{
    const std::string path = (std::filesystem::temp_directory_path() / "orbit_editor_roundtrip.scene").string();
    std::filesystem::remove(path);

    std::string error;
    {
        platform::Scene scene("Saved Scene");
        MakeShape(scene, "Ground Plate", {0.0f, 220.0f}, {900.0f, 60.0f}, 0);
        const platform::EntityID player = MakeShape(scene, "Player Avatar", {-30.0f, 15.0f}, {60.0f, 90.0f}, 2);
        scene.GetRegistry().GetComponent<platform::TransformComponent>(player)->Scale = {1.5f, 2.0f};
        scene.GetRegistry().GetComponent<platform::VisibilityComponent>(player)->Visible = false;

        REQUIRE(platform::SceneSerializer::Save(scene, path, error));
        REQUIRE(error.empty());
    }

    platform::Scene loaded("Loaded Scene");
    REQUIRE(platform::SceneSerializer::Load(loaded, path, error));
    REQUIRE(loaded.GetRegistry().EntityCount() == 2);

    bool foundPlayer = false;
    for (platform::EntityID entity : loaded.GetRegistry().GetAliveEntities())
    {
        const auto *name = loaded.GetRegistry().GetComponent<platform::NameComponent>(entity);
        REQUIRE(name != nullptr);
        if (name->Name != "Player Avatar")
        {
            continue;
        }

        foundPlayer = true;
        const auto *transform = loaded.GetRegistry().GetComponent<platform::TransformComponent>(entity);
        REQUIRE(transform != nullptr);
        REQUIRE(transform->Position.x == Catch::Approx(-30.0f));
        REQUIRE(transform->Position.y == Catch::Approx(15.0f));
        REQUIRE(transform->Scale.y == Catch::Approx(2.0f));
        REQUIRE(loaded.GetRegistry().GetComponent<platform::ShapeComponent>(entity)->Size.y == Catch::Approx(90.0f));
        REQUIRE(loaded.GetRegistry().GetComponent<platform::RenderLayerComponent>(entity)->LayerID == 2);
        REQUIRE(!loaded.GetRegistry().GetComponent<platform::VisibilityComponent>(entity)->Visible);
    }
    REQUIRE(foundPlayer);

    // Loading a missing file reports an error instead of silently emptying the scene.
    std::filesystem::remove(path);
    REQUIRE(!platform::SceneSerializer::Load(loaded, path, error));
    REQUIRE(!error.empty());
}

TEST_CASE("Editor UI rectangles hit-test and clip text", "[Editor]")
{
    const platform::UIRect rect{100.0f, 50.0f, 200.0f, 80.0f};

    REQUIRE(rect.Contains({100.0f, 50.0f}));
    REQUIRE(rect.Contains({200.0f, 90.0f}));
    REQUIRE(rect.Contains({300.0f, 130.0f}));
    REQUIRE(!rect.Contains({99.0f, 90.0f}));
    REQUIRE(!rect.Contains({200.0f, 131.0f}));

    REQUIRE(rect.Center().x == Catch::Approx(200.0f));
    REQUIRE(rect.Center().y == Catch::Approx(90.0f));

    const platform::UIRect inset = rect.Inset(10.0f);
    REQUIRE(inset.X == Catch::Approx(110.0f));
    REQUIRE(inset.Width == Catch::Approx(180.0f));

    // Panels rely on this to truncate long entity names to the panel width.
    REQUIRE(platform::EditorUI::TextWidth("ABCD", 1.0f) == Catch::Approx(32.0f));
    REQUIRE(platform::EditorUI::TextWidth("ABCD", 1.5f) == Catch::Approx(48.0f));
}

TEST_CASE("Editor widgets respond to real mouse input", "[Editor]")
{
    platform::Input input;
    input.Initialize();

    platform::EditorUI ui;
    const platform::UIRect button{100.0f, 100.0f, 120.0f, 30.0f};
    const platform::UIRect other{400.0f, 100.0f, 120.0f, 30.0f};

    // Hovering without pressing must not fire.
    input.OnMouseMove(150.0f, 115.0f);
    ui.BeginFrame(nullptr, &input, 1600.0f, 900.0f);
    REQUIRE(!ui.Button(button, "OK"));
    ui.EndFrame();

    // Press inside the button: it fires and consumes the click, so a second widget
    // under the same cursor does not also fire.
    input.NewFrame();
    input.OnMouseButtonDown(platform::MouseButton::Left);
    ui.BeginFrame(nullptr, &input, 1600.0f, 900.0f);
    REQUIRE(ui.ClickAvailable());
    REQUIRE(ui.Button(button, "OK"));
    REQUIRE(!ui.ClickAvailable());
    REQUIRE(!ui.Button(button, "OK"));
    ui.EndFrame();

    // A press outside the button leaves it alone but reaches the other widget.
    input.NewFrame();
    input.OnMouseMove(450.0f, 115.0f);
    input.OnMouseButtonDown(platform::MouseButton::Left);
    ui.BeginFrame(nullptr, &input, 1600.0f, 900.0f);
    REQUIRE(!ui.Button(button, "OK"));
    REQUIRE(ui.Button(other, "OTHER"));
    ui.EndFrame();

    // Disabled widgets never fire.
    input.NewFrame();
    input.OnMouseMove(150.0f, 115.0f);
    input.OnMouseButtonDown(platform::MouseButton::Left);
    ui.BeginFrame(nullptr, &input, 1600.0f, 900.0f);
    REQUIRE(!ui.Button(button, "OK", false));
    ui.EndFrame();
}

TEST_CASE("Toolbar buttons raise the matching editor action", "[Editor]")
{
    platform::EditorContext context;
    platform::Scene scene("Toolbar Scene");
    context.ActiveScene = &scene;

    platform::EditorWorkspace workspace;
    workspace.Initialize(context);
    workspace.LayoutPanels(1600.0f, 900.0f, 44.0f, 30.0f);

    platform::Input input;
    input.Initialize();
    platform::EditorUI ui;
    context.UI = &ui;
    context.Device = &input;

    platform::EditorMenuBar menuBar;

    // Nothing clicked: no action.
    input.OnMouseMove(800.0f, 400.0f);
    ui.BeginFrame(nullptr, &input, 1600.0f, 900.0f);
    REQUIRE(menuBar.Render(context, workspace) == platform::EditorAction::None);
    ui.EndFrame();

    // "NEW ENTITY" is the leftmost button, drawn at x=10 with a 24px tall body.
    input.NewFrame();
    input.OnMouseMove(40.0f, 20.0f);
    input.OnMouseButtonDown(platform::MouseButton::Left);
    ui.BeginFrame(nullptr, &input, 1600.0f, 900.0f);
    REQUIRE(menuBar.Render(context, workspace) == platform::EditorAction::NewEntity);
    ui.EndFrame();

    context.UI = nullptr;
    context.Device = nullptr;
}

TEST_CASE("Workspace layout fills the window and reserves the viewport", "[Editor]")
{
    platform::EditorContext context;
    platform::Scene scene("Layout Scene");
    context.ActiveScene = &scene;

    platform::EditorWorkspace workspace;
    workspace.Initialize(context);
    workspace.LayoutPanels(1600.0f, 900.0f, 44.0f, 30.0f);

    const platform::UIRect viewport = workspace.GetViewportRect();
    REQUIRE(viewport.Width > 400.0f);
    REQUIRE(viewport.Height > 200.0f);
    REQUIRE(viewport.Y >= 44.0f);
    REQUIRE(viewport.Bottom() <= 900.0f - 30.0f);

    // Every panel must land inside the window, otherwise it is invisible.
    for (const auto &entry : workspace.GetDockspace().GetPanels())
    {
        REQUIRE(entry.PanelPtr != nullptr);
        const platform::UIRect &bounds = entry.PanelPtr->GetBounds();
        REQUIRE(bounds.Width > 0.0f);
        REQUIRE(bounds.Height > 0.0f);
        REQUIRE(bounds.X >= 0.0f);
        REQUIRE(bounds.Right() <= 1600.0f);
        REQUIRE(bounds.Bottom() <= 900.0f);
    }

    // Maximizing hands the whole content area to the viewport.
    workspace.ToggleFullscreen();
    REQUIRE(workspace.IsFullscreen());
    workspace.LayoutPanels(1600.0f, 900.0f, 44.0f, 30.0f);
    REQUIRE(workspace.GetViewportRect().Width > viewport.Width);
    REQUIRE(workspace.GetScenePanel()->GetBounds().Width > viewport.Width);
}

TEST_CASE("Panels tolerate a headless context", "[Editor]")
{
    // Tests and CI run without a renderer; panels must skip drawing rather than crash.
    platform::EditorContext context;
    platform::Scene scene("Headless Scene");
    context.ActiveScene = &scene;
    MakeShape(scene, "Box", {0.0f, 0.0f}, {50.0f, 50.0f}, 0);

    platform::ScenePanel panel;
    REQUIRE(context.UI == nullptr);
    panel.OnRender(context);
    panel.OnUpdate(context, 1.0 / 60.0);

    context.Log("Info", "No console attached.");
    SUCCEED();
}
