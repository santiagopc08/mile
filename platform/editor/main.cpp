#include "editor/app/EditorApplication.hpp"
#include "engine/app/HeadlessOptions.hpp"
#include "engine/core/Logger.hpp"

int main(int argc, char **argv)
{
    const auto options = platform::HeadlessOptions::Parse(argc, argv);

    platform::WindowConfig config;
    config.Title = "ORBIT Authoring Platform — Standalone Editor";
    config.Width = 1600;
    config.Height = 900;

    platform::EditorApplication editorApp(config);
    if (!editorApp.Initialize(config))
    {
        return -1;
    }

    options.Apply(editorApp.GetEngine());

    LOG_INFO("+-----------------------------------------------------------------------+");
    LOG_INFO(" ");
    LOG_INFO("Editor Ready");
    LOG_INFO(" ");
    LOG_INFO("Panels     : Scene, Hierarchy, Inspector, Project, Console, Profiler, Assets");
    LOG_INFO("Mouse      : click to select, drag to move, right-drag to pan, wheel to zoom");
    LOG_INFO("Shortcuts  : Ctrl+N new, Ctrl+D duplicate, Del remove, Ctrl+Z/Y undo-redo");
    LOG_INFO("             Ctrl+S save, Ctrl+O load, W/E/R gizmo, F focus, G grid, Tab maximize");
    LOG_INFO(" ");
    LOG_INFO("+-----------------------------------------------------------------------+");

    editorApp.Run();
    editorApp.Shutdown();
    return 0;
}
