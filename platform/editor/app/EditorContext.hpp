#ifndef PLATFORM_EDITOR_APP_EDITOR_CONTEXT_HPP
#define PLATFORM_EDITOR_APP_EDITOR_CONTEXT_HPP

#include "engine/scene/Scene.hpp"
#include "editor/selection/SelectionSystem.hpp"
#include "editor/commands/CommandHistory.hpp"
#include "engine/filesystem/VirtualFileSystem.hpp"
#include "engine/assets/AssetManager.hpp"

#include <string>

namespace platform
{
    class EditorUI;
    class Input;
    class Camera2D;
    class ConsolePanel;

    /// Per-frame statistics surfaced by the profiler and status bar.
    struct EditorFrameStats
    {
        double FrameTimeMs{0.0};
        double FPS{0.0};
        uint64_t FrameNumber{0};
        size_t RenderedEntities{0};
    };

    struct EditorContext
    {
        Scene *ActiveScene{nullptr};
        SelectionSystem Selection;
        CommandHistory History{100};
        VirtualFileSystem VFS;
        AssetManager Assets;

        /// Live runtime services. These stay null in headless tests, and every panel
        /// must tolerate that by skipping its drawing pass.
        EditorUI *UI{nullptr};
        Input *Device{nullptr};
        Camera2D *Camera{nullptr};
        ConsolePanel *Console{nullptr};

        EditorFrameStats Stats;
        std::string ScenePath{"editor_scene.scene"};

        /// Append a line to the editor console (and the engine log). Safe when the
        /// console panel has not been wired up.
        void Log(const std::string &level, const std::string &message);
    };
}

#endif // PLATFORM_EDITOR_APP_EDITOR_CONTEXT_HPP
