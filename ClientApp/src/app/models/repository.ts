import { Movie } from "./movie.model";
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Filter, Pagination } from "./configClasses.repository";
import { Studio } from "./studio.model";
import { Order } from "./order.model";

const studiosUrl = "/api/studios";
const moviesUrl = "/api/movies";
const ordersUrl = "/api/orders";

@Injectable()
export class Repository {

	private filterObject = new Filter();
	private paginationObject = new Pagination();

	constructor(private http: HttpClient) {
		//this.filter.category = "Drama";
		this.filter.related = true;
		this.getMovies(true);
	}
	getMovie(id: number) {
		this.http.get("/api/movies/" + id)
			.subscribe(response => { this.movie = response });
		//console.log("Movie Data Received");
	}
	getMovies(related = false) {
		let url = moviesUrl + "?related=" + this.filter.related;
		if (this.filter.category) {
			url += "&category=" + this.filter.category;
		}
		if (this.filter.search) {
			url += "&search=" + this.filter.search;
		}
		url += "&metadata=true";
		this.http.get<any>(url)
			.subscribe(response => {
				this.movies = response.data;
				this.categories = response.categories;
				this.pagination.currentPage = 1;
			});
	}

	getStudios() {
		this.http.get<Studio[]>(studiosUrl)
			.subscribe(response => this.studios = response);
	}
	createMovie(mov: Movie) {
		let data = {
			image:mov.image, name: mov.name, category: mov.category,
			description: mov.description, price: mov.price,
			studio: mov.studio ? mov.studio.studioId : 0
		};
		this.http.post<number>(moviesUrl, data)
			.subscribe(response => {
				mov.movieId = response;
				this.movies.push(mov);
			});
	}
	createMovieAndStudio(mov: Movie, supp: Studio) {
		let data = {
			name: supp.name, city: supp.city, state: supp.state
		};
		this.http.post<number>(studiosUrl, data)
			.subscribe(response => {
				supp.studioId = response;
				mov.studio = supp;
				this.studios.push(supp);
				if (mov != null) {
					this.createMovie(mov);
				}
			});
	}

	replaceMovie(mov: Movie) {
		let data = {
			image:mov.image, name: mov.name, category: mov.category,
			description: mov.description, price: mov.price,
			studio: mov.studio ? mov.studio.studioId : 0
		};
		this.http.put(moviesUrl + "/" + mov.movieId, data)
			.subscribe(response => this.getMovies());
	}
	replaceStudio(stu: Studio) {
		let data = {
			name: stu.name, city: stu.city, state: stu.state
		};
		this.http.put(studiosUrl + "/" + stu.studioId, data)
			.subscribe(response => this.getMovies());
	}
	updateMovie(id: number, changes: Map<string, any>) {
		let patch = [];
		changes.forEach((value, key) =>
			patch.push({ op: "replace", path: key, value: value }));
		this.http.patch(moviesUrl + "/" + id, patch)
			.subscribe(response => this.getMovies());
	}
	deleteMovie(id: number) {
		this.http.delete(moviesUrl + "/" + id)
			.subscribe(response => this.getMovies());
	}
	deleteStudio(id: number) {
		this.http.delete(studiosUrl + "/" + id)
			.subscribe(response => {
				this.getMovies();
				this.getStudios();
			});
	}

	storeSessionData(dataType: string, data: any) {
		return this.http.post("/api/session/" + dataType, data)
			.subscribe(response => { });
	}
	getSessionData(dataType: string): any {
		return this.http.get("/api/session/" + dataType);
	}

	getOrders() {
		this.http.get<Order[]>(ordersUrl)
			.subscribe(data => this.orders = data);
	}
	createOrder(order: Order) {
		this.http.post<any>(ordersUrl, {
			name: order.name,
			address: order.address,
			payment: order.payment,
			movies: order.movies
		}).subscribe(data => {
			order.orderConfirmation = data
			order.cart.clear();
			order.clear();
		});
	}
	shipOrder(order: Order) {
		var theUrlAndID = ordersUrl + "/" + order.orderId;
		this.http.post(theUrlAndID,null)
			.subscribe(r => this.getOrders())
	}

	movie: Movie;
	movies: Movie[];
	studios: Studio[] = [];
	categories: string[] = [];
	orders: Order[] = [];

	get filter(): Filter {
		return this.filterObject;
	}
	get pagination(): Pagination {
		return this.paginationObject;
	}
}
