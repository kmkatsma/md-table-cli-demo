import { MdTablePage } from './app.po';

describe('md-table App', () => {
  let page: MdTablePage;

  beforeEach(() => {
    page = new MdTablePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
