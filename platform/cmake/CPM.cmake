# CPM.cmake - CMake Package Manager
# https://github.com/cpm-cmake/CPM.cmake

set(CPM_DOWNLOAD_VERSION 0.40.2)

if(NOT COMMAND CPMAddPackage)
  if(NOT DEFINED CPM_SOURCE_CACHE)
    set(CPM_SOURCE_CACHE "${CMAKE_BINARY_DIR}/_deps")
  endif()

  set(CPM_DOWNLOAD_LOCATION "${CMAKE_BINARY_DIR}/cmake/CPM_${CPM_DOWNLOAD_VERSION}.cmake")

  if(NOT EXISTS "${CPM_DOWNLOAD_LOCATION}")
    message(STATUS "Downloading CPM.cmake v${CPM_DOWNLOAD_VERSION}...")
    file(DOWNLOAD
      "https://github.com/cpm-cmake/CPM.cmake/releases/download/v${CPM_DOWNLOAD_VERSION}/CPM.cmake"
      "${CPM_DOWNLOAD_LOCATION}"
    )
  endif()

  include("${CPM_DOWNLOAD_LOCATION}")
endif()
