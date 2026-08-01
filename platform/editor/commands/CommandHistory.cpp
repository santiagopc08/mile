#include "editor/commands/CommandHistory.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    CommandHistory::CommandHistory(size_t maxDepth)
        : m_maxDepth(maxDepth)
    {
    }

    bool CommandHistory::ExecuteCommand(std::unique_ptr<ICommand> command)
    {
        if (!command)
        {
            return false;
        }

        std::string cmdName = command->GetName();
        if (command->Execute())
        {
            LOG_INFO("[CommandHistory] Executed command '{}'.", cmdName);
            m_undoStack.push_back(std::move(command));
            m_redoStack.clear();

            if (m_undoStack.size() > m_maxDepth)
            {
                m_undoStack.erase(m_undoStack.begin());
            }
            return true;
        }

        LOG_ERROR("[CommandHistory] Command '{}' execution failed.", cmdName);
        return false;
    }

    bool CommandHistory::Undo()
    {
        if (!CanUndo())
        {
            return false;
        }

        auto command = std::move(m_undoStack.back());
        m_undoStack.pop_back();

        std::string cmdName = command->GetName();
        if (command->Undo())
        {
            LOG_INFO("[CommandHistory] Undid command '{}'.", cmdName);
            m_redoStack.push_back(std::move(command));
            return true;
        }

        LOG_ERROR("[CommandHistory] Undo failed for command '{}'.", cmdName);
        return false;
    }

    bool CommandHistory::Redo()
    {
        if (!CanRedo())
        {
            return false;
        }

        auto command = std::move(m_redoStack.back());
        m_redoStack.pop_back();

        std::string cmdName = command->GetName();
        if (command->Execute())
        {
            LOG_INFO("[CommandHistory] Redid command '{}'.", cmdName);
            m_undoStack.push_back(std::move(command));
            return true;
        }

        LOG_ERROR("[CommandHistory] Redo failed for command '{}'.", cmdName);
        return false;
    }

    bool CommandHistory::CanUndo() const
    {
        return !m_undoStack.empty();
    }

    bool CommandHistory::CanRedo() const
    {
        return !m_redoStack.empty();
    }

    void CommandHistory::Clear()
    {
        m_undoStack.clear();
        m_redoStack.clear();
    }
}
