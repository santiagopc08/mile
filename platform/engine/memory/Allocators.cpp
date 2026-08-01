#include "engine/memory/Allocators.hpp"
#include <cstdlib>
#include <cassert>
#include <algorithm>

namespace platform
{
    ArenaAllocator::ArenaAllocator(size_t capacityBytes)
        : m_capacity(capacityBytes)
    {
        if (m_capacity > 0)
        {
            m_buffer = static_cast<uint8_t *>(std::malloc(m_capacity));
        }
    }

    ArenaAllocator::~ArenaAllocator()
    {
        if (m_buffer)
        {
            std::free(m_buffer);
            m_buffer = nullptr;
        }
    }

    void *ArenaAllocator::Allocate(size_t size, size_t alignment)
    {
        if (!m_buffer || size == 0) return nullptr;

        uintptr_t currentPtr = reinterpret_cast<uintptr_t>(m_buffer + m_offset);
        size_t mask = alignment - 1;
        uintptr_t alignedPtr = (currentPtr + mask) & ~mask;
        size_t padding = alignedPtr - currentPtr;

        if (m_offset + padding + size > m_capacity)
        {
            return nullptr; // Out of memory in Arena
        }

        m_offset += padding + size;
        return reinterpret_cast<void *>(alignedPtr);
    }

    void ArenaAllocator::Reset()
    {
        m_offset = 0;
    }

    PoolAllocator::PoolAllocator(size_t objectSize, size_t objectCount)
        : m_objectSize(std::max(objectSize, sizeof(Node))), m_objectCount(objectCount)
    {
        if (m_objectCount > 0)
        {
            m_buffer = static_cast<uint8_t *>(std::malloc(m_objectSize * m_objectCount));
            Reset();
        }
    }

    PoolAllocator::~PoolAllocator()
    {
        if (m_buffer)
        {
            std::free(m_buffer);
            m_buffer = nullptr;
        }
    }

    void PoolAllocator::Reset()
    {
        m_freeList = nullptr;
        m_allocatedCount = 0;

        for (size_t i = 0; i < m_objectCount; ++i)
        {
            auto *node = reinterpret_cast<Node *>(m_buffer + i * m_objectSize);
            node->Next = m_freeList;
            m_freeList = node;
        }
    }

    void *PoolAllocator::Allocate()
    {
        if (!m_freeList) return nullptr;

        Node *node = m_freeList;
        m_freeList = m_freeList->Next;
        m_allocatedCount++;

        return static_cast<void *>(node);
    }

    void PoolAllocator::Free(void *ptr)
    {
        if (!ptr) return;

        auto *node = static_cast<Node *>(ptr);
        node->Next = m_freeList;
        m_freeList = node;

        if (m_allocatedCount > 0)
        {
            m_allocatedCount--;
        }
    }
}
