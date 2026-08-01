#include "engine/save/SaveManager.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool SaveManager::save(const std::string &slotName, const SaveSlotData &data)
    {
        SaveSlotData slotData = data;
        slotData.slotName = slotName;
        slotData.valid = true;
        m_slots[slotName] = slotData;

        LOG_INFO("[SaveManager] Successfully saved slot '{}' (Distance: {:.1f}m, Score: {}).",
                 slotName, slotData.distanceMeters, slotData.score);
        return true;
    }

    bool SaveManager::load(const std::string &slotName, SaveSlotData &outData) const
    {
        auto it = m_slots.find(slotName);
        if (it != m_slots.end() && it->second.valid)
        {
            outData = it->second;
            LOG_INFO("[SaveManager] Successfully loaded slot '{}'.", slotName);
            return true;
        }
        return false;
    }

    bool SaveManager::deleteSave(const std::string &slotName)
    {
        return m_slots.erase(slotName) > 0;
    }

    std::vector<std::string> SaveManager::listSaves() const
    {
        std::vector<std::string> list;
        list.reserve(m_slots.size());
        for (const auto &[name, data] : m_slots)
        {
            if (data.valid) list.push_back(name);
        }
        return list;
    }

    bool SaveManager::validateSave(const std::string &slotName) const
    {
        auto it = m_slots.find(slotName);
        return (it != m_slots.end()) && it->second.valid;
    }
}
