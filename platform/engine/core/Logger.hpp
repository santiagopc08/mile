#ifndef PLATFORM_ENGINE_CORE_LOGGER_HPP
#define PLATFORM_ENGINE_CORE_LOGGER_HPP

#include <spdlog/spdlog.h>
#include <memory>
#include <string_view>

namespace platform
{
    class Logger
    {
    public:
        static void Initialize();
        static void Shutdown();

        template <typename... Args>
        static void Info(spdlog::format_string_t<Args...> fmt, Args &&...args)
        {
            spdlog::info(fmt, std::forward<Args>(args)...);
        }

        template <typename... Args>
        static void Warn(spdlog::format_string_t<Args...> fmt, Args &&...args)
        {
            spdlog::warn(fmt, std::forward<Args>(args)...);
        }

        template <typename... Args>
        static void Error(spdlog::format_string_t<Args...> fmt, Args &&...args)
        {
            spdlog::error(fmt, std::forward<Args>(args)...);
        }

        template <typename... Args>
        static void Debug(spdlog::format_string_t<Args...> fmt, Args &&...args)
        {
            spdlog::debug(fmt, std::forward<Args>(args)...);
        }
    };
}

#define LOG_INFO(...) ::platform::Logger::Info(__VA_ARGS__)
#define LOG_WARN(...) ::platform::Logger::Warn(__VA_ARGS__)
#define LOG_ERROR(...) ::platform::Logger::Error(__VA_ARGS__)
#define LOG_DEBUG(...) ::platform::Logger::Debug(__VA_ARGS__)

#endif // PLATFORM_ENGINE_CORE_LOGGER_HPP
