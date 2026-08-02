import { Component, signal, ViewChild, inject, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../app-loader/loader.component';
import { OperatorService } from '../../services/operator.service';
import { RechargeService } from '../../services/recharge.service';
import { AuthService } from '../../services/auth.service';
import { AEPSService } from '../../services/aeps.service';
import { BankService } from '../../services/bank.service';
import { MasterService, ServiceStatusResponse } from '../../services/master.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { OTPPayload } from '../../models/login-payload.model';

@Component({
    selector: 'app-changepin',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent, NgSelectModule],
    templateUrl: './changepin.component.html',
    styleUrls: ['./changepin.component.scss']
})
export class ChangepinComponent {


    @ViewChild('invoiceModal') invoiceModal: any;

    constructor(private modalService: NgbModal, private toastr: ToastrService, private operatorService: OperatorService, private masterService: MasterService, private fb: FormBuilder, private zone: NgZone) { }

    private rechargeService = inject(RechargeService);
    private authServiceobj = inject(AuthService);
    private aepsService = inject(AEPSService);
    private router = inject(Router);
    private bankService = inject(BankService);

    selectedicon: string = 'bi-phone';
    showRecentTxns = false;
    Name: string = '';
    PhoneNo: string = '';
    EmailID: string = '';
    PANNo: string = '';
    TxnPin: string = '';
    MPIN: string = '';
    AadharNo: string = '';

    showTxnPin = false;
    showMPin = false;
    showAadharNo = false;
    showPanNo = false;
    isLoading = false;

    otp: string = '';
    showInputAAdharError = false;
    showInputPANError = false;
    inputPANNumber: string = '';
    inputAadhar: string = '';
    @ViewChild('previewModal') previewModalobj: any;

    toggleTxnPin() {
        this.showTxnPin = !this.showTxnPin;
    }

    toggleMPin() {
        this.showMPin = !this.showMPin;
    }

    togglePanNo() {
        this.showPanNo = !this.showPanNo;
    }

    toggleAadharNo() {
        this.showAadharNo = !this.showAadharNo;
    }


    ngOnInit() {


        this.isLoading = true;
        const userId = this.authServiceobj.getUserId();
        const userName = this.authServiceobj.getUsername();

        if (!userId || !userName) {
            this.toastr.error('Session expired. Please login.');
            this.router.navigate(['/login']);
            return;
        }

        this.PhoneNo = this.authServiceobj.getUserPhoneNo();
        this.EmailID = this.authServiceobj.getUserEmailId();
        this.PANNo = this.authServiceobj.getUserPanCard();
        this.Name = this.authServiceobj.getUsername();
        this.AadharNo = this.authServiceobj.getUserAadharNumber();
        this.isLoading = false;

    }

    ValidateUser() {
        if (this.inputAadhar.trim() == "" && this.inputPANNumber.trim() == "") {
            this.toastr.error("Please Enter Aadhar Number And PAN Number!");
            this.showInputAAdharError = true;
            this.showInputPANError = true;
            return;
        }
        else if (this.inputAadhar.trim() == "" || this.inputAadhar.length < 12 || this.inputAadhar.length > 12) {
            this.toastr.error("Please Enter valid Aadhar Number!");
            this.showInputPANError = false;
            this.showInputAAdharError = true;
            return;
        }
        else if (this.inputPANNumber.trim() == "" || this.inputPANNumber.length < 10 || this.inputPANNumber.length > 10) {
            this.toastr.error("Please Enter valid PAN Number!");
            this.showInputAAdharError = false;
            this.showInputPANError = true;
            return;
        }

        else if (this.inputAadhar.trim() != this.AadharNo.toString().trim()) {
            this.toastr.error("Please Enter valid Aadhar Number!");
            this.showInputPANError = false;
            this.showInputAAdharError = true;
            return;
        }

        else if (this.inputPANNumber.trim() != this.PANNo.toString().trim()) {
            this.toastr.error("Please Enter valid PAN Number!");
            this.showInputPANError = true;
            this.showInputAAdharError = false;
            return;
        }
        else {
            const payload = {
                UserId: this.authServiceobj.getUserId().toString(),
                OldPassword: "",
                NewPassword: "",
                ConfirmPassword: "",
                Mode: '',
                PANNo: this.inputPANNumber.trim().toString(),
                AadharNo: this.inputAadhar.trim().toString()
            };
            this.isLoading = true;
            this.authServiceobj.ValidateUserInfo(payload).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    if (res.success) {
                        this.toastr.success("User Validated Successfully, Please Enter OTP And Change Password!");
                        this.authServiceobj.SaveOTPinCookies(res);
                        this.inputAadhar = "";
                        this.inputPANNumber = "";
                        this.modalService.open(this.previewModalobj, { size: 'lg', backdrop: 'static', keyboard: false });
                    } else {
                        this.toastr.error(res.message);
                        return;
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.toastr.error('Something went wrong');
                    console.error(err);
                }
            });
        }
    }

    CancelMoneyTransfer() {

        this.otp = "";
        this.modalService.dismissAll();

    }


    showFormErrors(form: FormGroup) {
        Object.keys(form.controls).forEach(field => {
            const control = form.get(field);

            if (control?.errors) {
                if (control.errors['required']) {
                    this.toastr.error(`${field} is required`);
                }
                if (control.errors['pattern']) {
                    this.toastr.error(`Invalid ${field}`);
                }
                if (control.errors['minlength']) {
                    this.toastr.error(`${field} is too short`);
                }
                if (control.errors['maxlength']) {
                    this.toastr.error(`${field} is too long`);
                }
            }

            control?.markAsTouched();
        });
    }


    get colClass(): string {
        if (this.showRecentTxns) {
            return 'form-group';
        }

        return 'col-md-4';
    }

    get disableclass(): string {

        return 'disablecss'
    }

    toggleRecentTxns() {
        this.showRecentTxns = !this.showRecentTxns;
    }

    updatePin() {

        if (!this.TxnPin || !this.MPIN) {
            this.toastr.error('Txn PIN and MPIN are required');
            return;
        }

        if (this.authServiceobj.getUserOTP() != this.otp) {
            this.toastr.error('Please Enter Valid OTP!');
            return;
        }

        Swal.fire({
            title: 'Confirm Update',
            text: 'Are you sure you want to update Txn PIN & MPIN?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Update',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#5a2b91',
            cancelButtonColor: '#6c757d'
        }).then((result) => {

            if (!result.isConfirmed) {
                return;
            }

            const payload = {
                UserId: this.authServiceobj.getUserId().toString(),
                TxnPin: this.TxnPin.toString(),
                MPin: this.MPIN.toString(),
                Mode: 'CPASS'
            };

            this.isLoading = true;

            this.authServiceobj.updateUserInfo(payload).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    if (res.success) {
                        this.toastr.success(res.message)
                        this.TxnPin = '';
                        this.MPIN = '';
                        this.otp = '';
                        this.inputAadhar='';
                        this.inputPANNumber='';
                        this.modalService.dismissAll();
                    } else {
                        this.toastr.error(res.message)
                        return;
                    }
                },
                error: () => {
                    this.isLoading = false;
                    this.toastr.error('API error')
                    return;
                }
            });
        });
    }

    ResendOTP() {
        const payload: OTPPayload = {
            userid: this.authServiceobj.getUserId().toString(),
            usertype:
                this.authServiceobj
                    .getUsertype()
                    .toString()
                    .toLowerCase()
                    .trim() === 'rt' || this.authServiceobj.getUsertype().toLowerCase().trim() === 'retailer'
                    ? 'Retailer'
                    : 'SuperAdmin',
                    otp:""
        };

        this.authServiceobj.ResendOTPEnc(payload).subscribe({
            next: (res) => {
                this.toastr.success('OTP Sent Successfully!');
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Failed to resend OTP');
            }
        });
    }



}
