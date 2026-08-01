#ifndef PLATFORM_ENGINE_MEMORY_ALLOCATORS_HPP
#define PLATFORM_ENGINE_MEMORY_ALLOCATORS_HPP

#include <cstddef>
#include <cstdint>
#include <vector>

namespace platform
{
    class ArenaAllocator
    {
    public:
        explicit ArenaAllocator(size_t capacityBytes);
        ~ArenaAllocator();

        ArenaAllocator(const ArenaAllocator &) = delete;
        ArenaAllocator &operator=(const ArenaAllocator &) = delete;

        void *Allocate(size_t size, size_t alignment = 8);
        void Reset();

        [[nodiscard]] size_t GetCapacity() const { return m_capacity; }
        [[nodiscard]] size_t GetUsedMemory() const { return m_offset; }

    private:
        uint8_t *m_buffer{nullptr};
        size_t m_capacity{0};
        size_t m_offset{0};
    };

    class PoolAllocator
    {
    public:
        PoolAllocator(size_t objectSize, size_t objectCount);
        ~PoolAllocator();

        PoolAllocator(const PoolAllocator &) = delete;
        PoolAllocator &operator=(const PoolAllocator &) = delete;

        void *Allocate();
        void Free(void *ptr);
        void Reset();

        [[nodiscard]] size_t GetObjectSize() const { return m_objectSize; }
        [[nodiscard]] size_t GetCapacity() const { return m_objectCount; }
        [[nodiscard]] size_t GetAllocatedCount() const { return m_allocatedCount; }

    private:
        struct Node
        {
            Node *Next;
        };

        uint8_t *m_buffer{nullptr};
        Node *m_freeList{nullptr};
        size_t m_objectSize{0};
        size_t m_objectCount{0};
        size_t m_allocatedCount{0};
    };
}

#endif // PLATFORM_ENGINE_MEMORY_ALLOCATORS_HPP
