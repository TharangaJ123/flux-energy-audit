// Layout tests that ensure shared shell content remains visible around page content.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/Layout';

describe('Layout', () => {
  test('renders child content and footer links', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Dashboard Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.getByText('Cost Management')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});
