#include <catch2/catch_test_macros.hpp>

#include "editor/selection/SelectionSystem.hpp"
#include "editor/commands/CommandHistory.hpp"
#include "editor/commands/EntityCommands.hpp"
#include "editor/workspace/EditorWorkspace.hpp"
#include "editor/app/EditorContext.hpp"
#include "engine/scene/Scene.hpp"

TEST_CASE("SelectionSystem Multi-target Selection", "[Editor]")
{
    platform::SelectionSystem selection;

    bool callbackFired = false;
    selection.OnSelectionChanged([&callbackFired](const platform::SelectionTarget &target) {
        (void)target;
        callbackFired = true;
    });

    selection.SetEntitySelection(42, "PlayerBuggy");
    REQUIRE(selection.HasSelection());
    REQUIRE(selection.GetSelection().Type == platform::SelectionType::Entity);
    REQUIRE(selection.GetSelection().Entity == 42);
    REQUIRE(selection.GetSelection().Name == "PlayerBuggy");
    REQUIRE(callbackFired);

    selection.SetFolderSelection("assets://textures/ui");
    REQUIRE(selection.GetSelection().Type == platform::SelectionType::Folder);
    REQUIRE(selection.GetSelection().PathStr == "assets://textures/ui");

    selection.Clear();
    REQUIRE(!selection.HasSelection());
}

TEST_CASE("CommandHistory Undo and Redo Execution", "[Editor]")
{
    platform::Scene scene("Test Command Scene");
    platform::CommandHistory history;

    REQUIRE(!history.CanUndo());
    REQUIRE(!history.CanRedo());

    auto cmd = std::make_unique<platform::CreateEntityCommand>(&scene, "BuggyWheel");
    REQUIRE(history.ExecuteCommand(std::move(cmd)));

    REQUIRE(scene.GetRegistry().EntityCount() == 1);
    REQUIRE(history.CanUndo());

    // Undo entity creation
    REQUIRE(history.Undo());
    REQUIRE(scene.GetRegistry().EntityCount() == 0);
    REQUIRE(history.CanRedo());

    // Redo entity creation
    REQUIRE(history.Redo());
    REQUIRE(scene.GetRegistry().EntityCount() == 1);
}

TEST_CASE("EditorWorkspace Panel Docking and Layout Persistence", "[Editor]")
{
    platform::EditorContext context;
    platform::Scene testScene("Workspace Scene");
    context.ActiveScene = &testScene;

    platform::EditorWorkspace workspace;
    workspace.Initialize(context);

    REQUIRE(workspace.GetDockspace().GetPanels().size() == 7);

    REQUIRE(workspace.SaveLayout("test_layout.json"));
    REQUIRE(workspace.LoadLayout("test_layout.json"));

    workspace.ToggleFullscreen();
    REQUIRE(workspace.IsFullscreen());
}
