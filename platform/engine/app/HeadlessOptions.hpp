#ifndef PLATFORM_ENGINE_APP_HEADLESS_OPTIONS_HPP
#define PLATFORM_ENGINE_APP_HEADLESS_OPTIONS_HPP

#include "engine/app/Engine.hpp"

#include <cstdlib>
#include <string>

namespace platform
{
    /// Command line switches shared by the native applications:
    ///   --frames N            run N frames then exit
    ///   --screenshot PATH     write the last drawn frame to PATH (BMP)
    struct HeadlessOptions
    {
        uint64_t Frames{0};
        std::string ScreenshotPath;

        static HeadlessOptions Parse(int argc, char **argv)
        {
            HeadlessOptions options;
            for (int i = 1; i < argc; ++i)
            {
                const std::string argument = argv[i];
                if (argument == "--frames" && i + 1 < argc)
                {
                    options.Frames = std::strtoull(argv[++i], nullptr, 10);
                }
                else if (argument == "--screenshot" && i + 1 < argc)
                {
                    options.ScreenshotPath = argv[++i];
                }
            }
            return options;
        }

        void Apply(Engine *engine) const
        {
            if (!engine)
            {
                return;
            }
            if (Frames != 0)
            {
                engine->SetExitAfterFrames(Frames);
            }
            if (!ScreenshotPath.empty())
            {
                // Capture the final frame of the run, once everything has settled.
                engine->RequestScreenshot(ScreenshotPath, Frames > 0 ? Frames - 1 : 0);
            }
        }
    };
}

#endif // PLATFORM_ENGINE_APP_HEADLESS_OPTIONS_HPP
