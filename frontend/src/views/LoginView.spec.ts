import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginView from './LoginView.vue'

const { login, push } = vi.hoisted(() => ({ login: vi.fn(), push: vi.fn() }))

vi.mock('../services/auth', () => ({ login }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

describe('LoginView', () => {
  beforeEach(() => {
    login.mockReset()
    push.mockReset()
  })

  it('submits entered credentials and navigates home after success', async () => {
    login.mockResolvedValue({ email: 'student@campus.edu', role: 'student' })
    const wrapper = mount(LoginView)

    await wrapper.get('#login-email').setValue('student@campus.edu')
    await wrapper.get('#login-password').setValue('Campus123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(login).toHaveBeenCalledWith('student@campus.edu', 'Campus123')
    expect(push).toHaveBeenCalledWith('/')
  })

  it('shows the authentication error and stays on the page', async () => {
    login.mockRejectedValue(new Error('E-mail ou mot de passe incorrect.'))
    const wrapper = mount(LoginView)

    await wrapper.get('#login-email').setValue('student@campus.edu')
    await wrapper.get('#login-password').setValue('wrong')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('E-mail ou mot de passe incorrect.')
    expect(push).not.toHaveBeenCalled()
  })
})
