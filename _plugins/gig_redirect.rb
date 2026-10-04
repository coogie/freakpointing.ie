module Jekyll
  class RedirectPage < PageWithoutAFile
    def initialize(site, base, dir, item)
      @site = site
      @base = base
      @dir = dir
      @name = 'index.html'
      
      self.process(@name)
      
      # Assign front matter and data directly
      self.data = {
        'layout' => 'redirect',
        'title' => item['title'],
        'redirect_to' => item['redirect_to'],
        'permalink' => "/gig/#{item['key']}/"
      }
    end
  end

  class RedirectGenerator < Generator
    safe true

    def generate(site)
      redirects_data = site.data['gigs']
      items = redirects_data.is_a?(Hash) ? redirects_data['gigs'] : redirects_data
      return unless items.is_a?(Array)

      items.each do |item|
        site.pages << RedirectPage.new(site, site.source, "gigs/#{item['key']}", item)
      end
    end
  end
end