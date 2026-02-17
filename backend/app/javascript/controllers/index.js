import { Application } from "@hotwired/stimulus";
import StockChartController from "./stock_chart_controller";

const application = Application.start();
application.register("stock-chart", StockChartController);

export { application };