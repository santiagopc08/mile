#ifndef PLATFORM_EDITOR_COMMANDS_COMMAND_HISTORY_HPP
#define PLATFORM_EDITOR_COMMANDS_COMMAND_HISTORY_HPP

#include "editor/commands/ICommand.hpp"
#include <memory>
#include <vector>

namespace platform
{
    class CommandHistory
    {
    public:
        explicit CommandHistory(size_t maxDepth = 100);

        bool ExecuteCommand(std::unique_ptr<ICommand> command);

        bool Undo();
        bool Redo();

        [[nodiscard]] bool CanUndo() const;
        [[nodiscard]] bool CanRedo() const;

        void Clear();

        [[nodiscard]] size_t GetUndoCount() const { return m_undoStack.size(); }
        [[nodiscard]] size_t GetRedoCount() const { return m_redoStack.size(); }

    private:
        std::vector<std::unique_ptr<ICommand>> m_undoStack;
        std::vector<std::unique_ptr<ICommand>> m_redoStack;
        size_t m_maxDepth{100};
    };
}

#endif // PLATFORM_EDITOR_COMMANDS_COMMAND_HISTORY_HPP
