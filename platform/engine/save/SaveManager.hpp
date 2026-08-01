#ifndef PLATFORM_ENGINE_SAVE_SAVE_MANAGER_HPP
#define PLATFORM_ENGINE_SAVE_SAVE_MANAGER_HPP

#include <string>
#include <vector>
#include <unordered_map>

namespace platform
{
    struct SaveSlotData
    {
        std::string slotName;
        double distanceMeters{0.0};
        uint32_t coinsCollected{0};
        uint64_t score{0};
        uint32_t checkpointIndex{0};
        bool valid{true};
    };

    class SaveManager
    {
    public:
        SaveManager() = default;

        bool save(const std::string &slotName, const SaveSlotData &data);
        bool load(const std::string &slotName, SaveSlotData &outData) const;
        bool deleteSave(const std::string &slotName);

        [[nodiscard]] std::vector<std::string> listSaves() const;
        [[nodiscard]] bool validateSave(const std::string &slotName) const;

    private:
        std::unordered_map<std::string, SaveSlotData> m_slots;
    };
}

#endif // PLATFORM_ENGINE_SAVE_SAVE_MANAGER_HPP
