# Release lifecycle: the single build-time answer to "is this release out yet?"
#
# Sets `released` (true/false) on every entry in _data/releases.yml by comparing
# its `release_date` with the build time. Templates read `r.released`, never
# `release_date` or `'now'` directly, so build-time logic lives here only.
#
# A static site can be served long after it was built, so a release that is
# still pending at build time also gets a runtime switch: templates put
# `data-release-at` on its markup and script.js flips it to released in the
# browser when the moment passes (see "Release countdowns" in script.js).
#
# `release_date` may be a full timestamp (2026-05-21T12:00:00+01:00, YAML Time)
# or a bare date (2026-04-15, YAML Date: treated as midnight UTC). A release
# with no `release_date` is treated as released.
module Jekyll
  module ReleasePhase
    def self.released?(release_date, now)
      return true if release_date.nil?

      at =
        case release_date
        when DateTime, Time then release_date.to_time
        when Date then Time.utc(release_date.year, release_date.month, release_date.day)
        else release_date.to_time
        end
      at <= now
    end
  end

  class ReleasePhaseGenerator < Generator
    safe true
    # Run before any other generator so `released` exists wherever data is read.
    priority :highest

    def generate(site)
      Array(site.data['releases']).each do |release|
        release['released'] = ReleasePhase.released?(release['release_date'], site.time)
      end
    end
  end
end
