import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  it('renders the reservation landing page without calling an API', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(HomeView, { global: { stubs: { RouterLink: true } } })

    expect(wrapper.text()).toContain('Réservez votre salle')
    expect(wrapper.text()).toContain('Trouvez la salle idéale')
    expect(wrapper.text()).toContain('Salles disponibles')
    expect(wrapper.text()).toContain('Rechercher')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('changes the active how-it-works step on click', async () => {
    const wrapper = mount(HomeView, { global: { stubs: { RouterLink: true } } })

    await wrapper.get('.step:nth-child(3)').trigger('click')

    expect(wrapper.get('.how-detail-copy h3').text()).toBe('Réserver')
  })
})
