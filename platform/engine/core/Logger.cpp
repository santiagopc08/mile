#include "engine/core/Logger.hpp"
#include <spdlog/sinks/stdout_color_sinks.h>

namespace platform
{
    void Logger::Initialize()
    {
        spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] %v");
        spdlog::set_level(spdlog::level::trace);
        spdlog::info("Logger initialized.");
    }

    void Logger::Shutdown()
    {
        spdlog::info("Logger shutting down.");
        spdlog::shutdown();
    }
}
