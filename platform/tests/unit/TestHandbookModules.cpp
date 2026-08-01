#include <catch2/catch_test_macros.hpp>

#include "engine/modules/ModuleRegistry.hpp"
#include "engine/memory/Allocators.hpp"
#include "engine/events/EventQueue.hpp"

class TestAudioModule : public platform::IModule
{
public:
    TestAudioModule()
    {
        m_desc.Name = "AudioModule";
        m_desc.ID = 100;
        m_desc.Priority = 10;
    }

    bool Initialize() override
    {
        m_state = platform::ModuleState::Initialized;
        return true;
    }

    void Shutdown() override
    {
        m_state = platform::ModuleState::Stopped;
    }

    void Update(double dt) override { (void)dt; }
    void Configure() override { m_state = platform::ModuleState::Configured; }

    [[nodiscard]] const platform::ModuleDescriptor &GetDescriptor() const override { return m_desc; }
    [[nodiscard]] platform::ModuleState GetState() const override { return m_state; }
    [[nodiscard]] platform::ModuleDiagnostics GetDiagnostics() const override { return m_diag; }

private:
    platform::ModuleDescriptor m_desc;
    platform::ModuleState m_state{platform::ModuleState::Created};
    platform::ModuleDiagnostics m_diag{1024, 0.5, true};
};

class TestPhysicsModule : public platform::IModule
{
public:
    TestPhysicsModule()
    {
        m_desc.Name = "PhysicsModule";
        m_desc.ID = 200;
        m_desc.Priority = 20;
    }

    bool Initialize() override
    {
        m_state = platform::ModuleState::Initialized;
        return true;
    }

    void Shutdown() override
    {
        m_state = platform::ModuleState::Stopped;
    }

    void Update(double dt) override { (void)dt; }
    void Configure() override { m_state = platform::ModuleState::Configured; }

    [[nodiscard]] const platform::ModuleDescriptor &GetDescriptor() const override { return m_desc; }
    [[nodiscard]] platform::ModuleState GetState() const override { return m_state; }
    [[nodiscard]] platform::ModuleDiagnostics GetDiagnostics() const override { return m_diag; }

private:
    platform::ModuleDescriptor m_desc;
    platform::ModuleState m_state{platform::ModuleState::Created};
    platform::ModuleDiagnostics m_diag{2048, 1.2, true};
};

TEST_CASE("HANDBOOK-002 Module System Registry and Priority Sorting", "[ModuleSystem]")
{
    platform::ModuleRegistry registry;
    auto audioMod = std::make_shared<TestAudioModule>();
    auto physicsMod = std::make_shared<TestPhysicsModule>();

    REQUIRE(registry.RegisterModule(audioMod));
    REQUIRE(registry.RegisterModule(physicsMod));
    REQUIRE(registry.GetModuleCount() == 2);

    REQUIRE(registry.InitializeModules());
    REQUIRE(audioMod->GetState() == platform::ModuleState::Initialized);
    REQUIRE(physicsMod->GetState() == platform::ModuleState::Initialized);

    registry.ShutdownModules();
    REQUIRE(audioMod->GetState() == platform::ModuleState::Stopped);
    REQUIRE(physicsMod->GetState() == platform::ModuleState::Stopped);
}

TEST_CASE("HANDBOOK-003 ArenaAllocator & PoolAllocator RAII Memory", "[MemoryModel]")
{
    // Test Arena Allocator
    platform::ArenaAllocator arena(1024);
    REQUIRE(arena.GetCapacity() == 1024);
    REQUIRE(arena.GetUsedMemory() == 0);

    void *ptr1 = arena.Allocate(128);
    REQUIRE(ptr1 != nullptr);
    REQUIRE(arena.GetUsedMemory() >= 128);

    arena.Reset();
    REQUIRE(arena.GetUsedMemory() == 0);

    // Test Pool Allocator
    platform::PoolAllocator pool(64, 10);
    REQUIRE(pool.GetCapacity() == 10);
    REQUIRE(pool.GetAllocatedCount() == 0);

    void *obj1 = pool.Allocate();
    void *obj2 = pool.Allocate();
    REQUIRE(obj1 != nullptr);
    REQUIRE(obj2 != nullptr);
    REQUIRE(pool.GetAllocatedCount() == 2);

    pool.Free(obj1);
    REQUIRE(pool.GetAllocatedCount() == 1);
}
