#ifndef PLATFORM_EDITOR_COMMANDS_I_COMMAND_HPP
#define PLATFORM_EDITOR_COMMANDS_I_COMMAND_HPP

#include <string>

namespace platform
{
    class ICommand
    {
    public:
        virtual ~ICommand() = default;

        virtual bool Execute() = 0;
        virtual bool Undo() = 0;
        [[nodiscard]] virtual std::string GetName() const = 0;
    };
}

#endif // PLATFORM_EDITOR_COMMANDS_I_COMMAND_HPP
