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

  #login?: LoginPage;
  #dashboard?: DashboardPage;
  #orgSelection?: OrgSelectionPage;
  #forecastList?: ForecastListPage;
  #forecastGrid?: ForecastGridPage;
  #createForecastModal?: CreateForecastModal;
  #addDriverModal?: AddDriverModal;
  #copyForecastModal?: CopyForecastModal;
  #compareModal?: CompareModal;

  constructor(page: Page) {
    this.page = page;
  }

  login(): LoginPage {
    return (this.#login ??= new LoginPage(this.page));
  }

  dashboard(): DashboardPage {
    return (this.#dashboard ??= new DashboardPage(this.page));
  }

  orgSelection(): OrgSelectionPage {
    return (this.#orgSelection ??= new OrgSelectionPage(this.page));
  }

  forecastList(): ForecastListPage {
    return (this.#forecastList ??= new ForecastListPage(this.page));
  }

  forecastGrid(): ForecastGridPage {
    return (this.#forecastGrid ??= new ForecastGridPage(this.page));
  }

  createForecastModal(): CreateForecastModal {
    return (this.#createForecastModal ??= new CreateForecastModal(this.page));
  }

  addDriverModal(): AddDriverModal {
    return (this.#addDriverModal ??= new AddDriverModal(this.page));
  }

  copyForecastModal(): CopyForecastModal {
    return (this.#copyForecastModal ??= new CopyForecastModal(this.page));
  }

  compareModal(): CompareModal {
    return (this.#compareModal ??= new CompareModal(this.page));
  }
}
