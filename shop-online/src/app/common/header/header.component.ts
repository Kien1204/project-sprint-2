import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {CookieService} from '../../login/service/cookie.service';
import {ToastrService} from 'ngx-toastr';
import {LogoutService} from '../../login/service/logout.service';
import {Router} from '@angular/router';
import {CommonService} from '../../login/service/common.service';
import {OrderService} from "../../service/order.service";
import {Customer} from "../../model/customer";
import {Order} from "../../model/order";
import {CustomerService} from "../../service/customer.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  role: string = '';
  username: string = '';
  token: string = '';
  messageReceived: any;
  private subscriptionName: Subscription;
  productOrders: Order[] = [];
  customer: Customer;
  count: number = 0;

  constructor(private cookieService: CookieService,
              private toastrService: ToastrService,
              private logoutService: LogoutService,
              private router: Router,
              private commonService: CommonService,
              private orderService: OrderService,
              private customerService: CustomerService) {
    this.role = this.readCookieService('role');
    this.username = this.readCookieService('username');
    this.token = this.readCookieService('jwToken');
    // subscribe to sender component messages
    this.subscriptionName = this.commonService.getUpdate().subscribe(message => {
      this.messageReceived = message;
      this.role = this.readCookieService('role');
      this.username = this.readCookieService('username');
      this.token = this.readCookieService('jwToken');
      this.getCustomerByUsername(this.username)
    });
  }

  ngOnInit(): void {
    this.getCustomerByUsername(this.username)

  }

  /**
   * @date 14/08/2022
   * @author PhuongTd
   * @param key
   */
  readCookieService(key: string): string {
    return this.cookieService.getCookie(key);
  }

  onLogout() {
    setTimeout(() => {
      if (this.cookieService.getCookie('jwToken') != null) {
        this.logoutService.onLogout(this.cookieService.getCookie('jwToken')).subscribe(() => {
          this.cookieService.deleteAllCookies();
          this.cookieService.removeAllCookies();
        }, error => {
          switch (error.error) {
            case 'isLogout':
              this.toastrService.warning('B???n ch??a ????ng nh???p!');
              break;
            case 'LoginExpired':
              this.cookieService.deleteAllCookies();
              this.router.navigateByUrl('/login').then(() => {
                this.toastrService.warning('H???t phi??n ????ng nh???p vui l??ng ????ng nh???p l???i!');
                this.sendMessage();
              });
              break;
            default:
              this.cookieService.deleteAllCookies();
              this.cookieService.removeAllCookies();
              this.router.navigateByUrl('/login').then(() => {
                this.toastrService.warning('H???t phi??n ????ng nh???p vui l??ng ????ng nh???p l???i!');
                this.sendMessage();
              });
              break;
          }
        }, () => {
          this.router.navigateByUrl('/login').then(() => {
            this.toastrService.success('????ng xu???t th??nh c??ng!');
            this.sendMessage();
          });
        });
      } else {
        this.toastrService.warning('B???n ch??a ????ng nh???p!');
      }
    }, 1000)
    this.router.navigateByUrl("/loading").then(() => {
    })
  }

  ngOnDestroy(): void {
    this.subscriptionName.unsubscribe();
  }

  sendMessage(): void {
    // send message to subscribers via observable subject
    this.commonService.sendUpdate('????ng Xu???t th??nh c??ng!');
  }

  getCustomerByUsername(username: string) {
    this.customerService.getCustomerByUserName(username).subscribe(value => {
      this.customer = value;
      this.getProductInCardByCustomer(value);
    });
  }

  getProductInCardByCustomer(customer: Customer) {
    this.count = 0;
    this.orderService.getProductInCardByCustomer(customer).subscribe((pos: Order[]) => {
      if (pos != null) {
        this.productOrders = pos;
        for (let i = 0; i < pos.length; i++) {
          this.count += pos[i].quantity;
        }
      } else {
        this.productOrders = [];
      }
    });
  }
}
