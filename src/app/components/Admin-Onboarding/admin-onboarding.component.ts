import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminOnboardingService } from '../../services/admin-onboarding.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { LoaderComponent } from '../app-loader/loader.component';

@Component({selector:'app-admin-onboarding',standalone:true,imports:[CommonModule,FormsModule,NgSelectModule,LoaderComponent],templateUrl:'./admin-onboarding.component.html',styleUrl:'./admin-onboarding.component.scss'})
export class AdminOnboardingComponent implements OnInit{
 private api=inject(AdminOnboardingService);private route=inject(ActivatedRoute);private router=inject(Router);loading=false; error=''; message=''; rows:any[]=[]; salesPeople:any[]=[]; selected:any=null; total=0;detailId=0;showAllHistory=false;reviewTab:'documents'|'information'='documents';
 private today(){const now=new Date();const offset=now.getTimezoneOffset();return new Date(now.getTime()-offset*60000).toISOString().slice(0,10);}
 filters:any={pageIndex:1,pageSize:10,search:'',status:'',fromDate:this.today(),toDate:this.today(),salesTeamId:''};
 dialog:''|'decision'|'finalReject'|'approve'|'retry'='';dialogTitle='';dialogText='';dialogRemarks='';pendingKind:'field'|'document'='field';pendingItem:any=null;pendingStatus:'Approved'|'Rejected'='Approved';
 ngOnInit(){this.detailId=Number(this.route.snapshot.paramMap.get('id'))||0;if(this.detailId)this.loadDetail(this.detailId);else{this.load();this.api.salesPeople().subscribe({next:r=>this.salesPeople=r.data||[]});}}
 load(){if(this.filters.fromDate&&this.filters.toDate&&this.filters.fromDate>this.filters.toDate){this.error='From Date cannot be later than To Date.';return;}this.loading=true;this.error='';this.api.list(this.filters).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{this.rows=r.data.data;this.total=r.data.totalCount;},error:e=>this.error=e.error?.message||'Unable to load onboardings.'});}
 reset(){const today=this.today();this.filters={pageIndex:1,pageSize:10,search:'',status:'',fromDate:today,toDate:today,salesTeamId:''};this.load();}
 page(delta:number){const p=this.filters.pageIndex+delta;if(p<1||p>Math.ceil(this.total/this.filters.pageSize))return;this.filters.pageIndex=p;this.load();}
 open(id:number){void this.router.navigate(['/sales-team-onboarded',id]);}
 private loadDetail(id:number,resetTab=true){this.loading=true;if(resetTab){this.reviewTab='documents';this.showAllHistory=false;}this.api.detail(id).pipe(finalize(()=>this.loading=false)).subscribe({next:r=>this.selected=r.data,error:e=>this.error=e.error?.message||'Unable to open review.'});}
 backToList(){void this.router.navigate(['/sales-team-onboarded']);}
 decide(kind:'field'|'document',item:any,status:'Approved'|'Rejected'){if(!this.canDecide(item))return;this.pendingKind=kind;this.pendingItem=item;this.pendingStatus=status;this.dialogRemarks='';if(status==='Approved'){this.executeDecision();return;}this.dialog='decision';this.dialogTitle=`Reject ${item.fieldName||item.documentType}`;this.dialogText='A clear rejection remark is mandatory and will be visible to the Sales Person.';}
 private executeDecision(){if(this.pendingStatus==='Rejected'&&this.dialogRemarks.trim().length<3){this.error='Rejection remarks are mandatory.';return;}const call=this.pendingKind==='field'?this.api.decideField(this.selected.userId,this.pendingItem.id,this.pendingStatus,this.dialogRemarks.trim()):this.api.decideDocument(this.selected.userId,this.pendingItem.id,this.pendingStatus,this.dialogRemarks.trim());this.loading=true;call.pipe(finalize(()=>this.loading=false)).subscribe({next:()=>{this.closeDialog();this.message='Review decision saved.';this.loadDetail(this.selected.userId,false);},error:e=>this.error=e.error?.message||'Decision could not be saved.'});}
 reject(){this.dialog='finalReject';this.dialogTitle='Reject onboarding';this.dialogText='The Sales Person will receive these final remarks and can correct and resubmit the application.';this.dialogRemarks='';}
 approve(){this.dialog='approve';this.dialogTitle='Approve and activate?';this.dialogText='All validations will run again. The account will be activated and credentials emailed to the registered address.';}
 retryEmail(){this.dialog='retry';this.dialogTitle='Retry credential email?';this.dialogText='A new temporary password will be generated and sent to the registered email address.';}
 confirmDialog(){if(this.dialog==='decision'){this.executeDecision();return;}if(this.dialog==='finalReject'){if(this.dialogRemarks.trim().length<5){this.error='Final rejection remarks must contain at least 5 characters.';return;}this.loading=true;this.api.reject(this.selected.userId,this.dialogRemarks.trim()).pipe(finalize(()=>this.loading=false)).subscribe({next:()=>{this.closeDialog();this.backToList();},error:e=>this.error=e.error?.message||'Rejection failed.'});return;}const call=this.dialog==='approve'?this.api.approve(this.selected.userId,this.selected.rowVersion):this.api.retryCredentialEmail(this.selected.userId);this.loading=true;call.pipe(finalize(()=>this.loading=false)).subscribe({next:()=>{this.closeDialog();this.backToList();},error:e=>this.error=e.error?.message||'Action failed.'});}
 closeDialog(){this.dialog='';this.dialogRemarks='';}
 get pages(){return Math.max(1,Math.ceil(this.total/this.filters.pageSize));}
 get isReviewable(){return this.selected?.user?.onboardingStatus==='PendingReview'||this.selected?.user?.onboardingStatus==='PendingReReview';}
 canDecide(item:any){return this.isReviewable&&item?.reviewStatus==='Pending';}
 roleName(type:string){return ({RT:'Retailer',AD:'Distributor',MD:'Master Distributor'} as Record<string,string>)[type]||type||'—';}
 get visibleHistory(){const history=this.selected?.history||[];return this.showAllHistory?history:history.slice(0,6);}
 track(_:number,x:any){return x.id||x.userId;}
 viewDocument(d:any){this.loading=true;this.api.document(this.selected.userId,d.id).pipe(finalize(()=>this.loading=false)).subscribe({next:blob=>{const url=URL.createObjectURL(blob);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);},error:e=>this.error=e.error?.message||'Document could not be opened.'});}
 viewVersion(v:any){this.loading=true;this.api.documentVersion(this.selected.userId,v.id).pipe(finalize(()=>this.loading=false)).subscribe({next:blob=>{const url=URL.createObjectURL(blob);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);},error:e=>this.error=e.error?.message||'Document version could not be opened.'});}
}
