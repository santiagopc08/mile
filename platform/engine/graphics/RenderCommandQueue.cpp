#include "engine/graphics/RenderCommandQueue.hpp"

namespace platform
{
    RenderCommandQueue::RenderCommandQueue() = default;

    void RenderCommandQueue::Enqueue(std::unique_ptr<RenderCommand> command)
    {
        if (command)
        {
            m_commands.push_back(std::move(command));
        }
    }

    void RenderCommandQueue::Flush(SDL_Renderer *renderer)
    {
        if (!renderer)
        {
            ClearQueue();
            return;
        }

        for (auto &command : m_commands)
        {
            if (command)
            {
                command->Execute(renderer);
            }
        }

        ClearQueue();
    }

    void RenderCommandQueue::ClearQueue()
    {
        m_commands.clear();
    }
}
