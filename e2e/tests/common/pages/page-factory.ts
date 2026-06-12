import { Page } from "@playwright/test";
import { AddDriverModal } from "../../workbench/pages/add-driver.modal";
import { CompareModal } from "../../workbench/pages/compare.modal";
import { CopyForecastModal } from "../../workbench/pages/copy-forecast.modal";
import { CreateForecastModal } from "../../workbench/pages/create-forecast.modal";
import { DashboardPage } from "../../workbench/pages/dashboard.page";
import { ForecastGridPage } from "../../workbench/pages/forecast-grid.page";
import { ForecastListPage } from "../../workbench/pages/forecast-list.page";
import { LoginPage } from "../../workbench/pages/login.page";
import { OrgSelectionPage } from "../../workbench/pages/org-selection.page";

/** Single entry point to every page object, mirroring the page under test. */
export class PageFactory {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  login(): LoginPage {
    return new LoginPage(this.page);
  }

  dashboard(): DashboardPage {
    return new DashboardPage(this.page);
  }

  orgSelection(): OrgSelectionPage {
    return new OrgSelectionPage(this.page);
  }

  forecastList(): ForecastListPage {
    return new ForecastListPage(this.page);
  }

  forecastGrid(): ForecastGridPage {
    return new ForecastGridPage(this.page);
  }

  createForecastModal(): CreateForecastModal {
    return new CreateForecastModal(this.page);
  }

  addDriverModal(): AddDriverModal {
    return new AddDriverModal(this.page);
  }

  copyForecastModal(): CopyForecastModal {
    return new CopyForecastModal(this.page);
  }

  compareModal(): CompareModal {
    return new CompareModal(this.page);
  }
}
