import React from 'react'

export default function JobFilters({
  customizeTab,
  setCustomizeTab,
  workMode,
  setWorkMode,
  experience,
  setExperience,
  salaryRange,
  setSalaryRange,
  salaryRanges = ['Any', '0-5 LPA', '5-10 LPA', '10-20 LPA', '20+ LPA'],
  inline = false,
  onClose,
}) {
  const tabs = ['Work Mode', 'Experience', 'Salary']

  const TabButton = ({ index, label }) => (
    <button
      type="button"
      onClick={() => setCustomizeTab(index)}
      className={`w-full rounded-full px-5 py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
        customizeTab === index
          ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-md'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )

  const FilterButton = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border py-2 text-sm font-medium transition-colors duration-200 ${
        active
          ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
          : 'border-gray-600 text-gray-300 hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  )

  return (
    <>
      <div className="bg-neutral-800 rounded-full p-1 flex">
        <div className="grid w-full grid-cols-3 gap-1">
          {tabs.map((t, i) => (
            <TabButton key={t} index={i} label={t} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        {customizeTab === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['Any', 'Remote', 'Hybrid', 'Onsite'].map((mode) => (
              <FilterButton key={mode} active={workMode === mode} onClick={() => setWorkMode(mode)}>
                {mode}
              </FilterButton>
            ))}
          </div>
        )}

        {customizeTab === 1 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['Any', 'Junior', 'Mid', 'Senior'].map((lvl) => (
              <FilterButton key={lvl} active={experience === lvl} onClick={() => setExperience(lvl)}>
                {lvl}
              </FilterButton>
            ))}
          </div>
        )}

        {customizeTab === 2 && (
          <div>
            {/* Map slider steps to existing ranges to avoid logic changes */}
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              className="w-full accent-blue-500"
              value={Math.max(0, salaryRanges.indexOf(salaryRange))}
              onChange={(e) => {
                const idx = Number(e.target.value)
                const next = salaryRanges[idx] ?? 'Any'
                setSalaryRange(next)
              }}
            />
            <div className="mt-2 text-sm text-gray-400">
              {salaryRange}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          type="button"
          className="w-full py-2 rounded-lg bg-neutral-700 text-gray-300 hover:bg-neutral-600"
          onClick={() => {
            setSalaryRange('Any')
            setWorkMode('Any')
            setExperience('Any')
          }}
        >
          Reset
        </button>
        {!inline && (
          <div className="mt-2 flex justify-end">
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </>
  )
}


