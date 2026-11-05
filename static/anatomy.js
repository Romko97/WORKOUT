'use strict';

// Original anatomy illustration with programmable region overlays.
const ANATOMY_BODY_SOURCE = '/static/images/anatomy-body.png';
let anatomyImageURL;
function anatomySourceURL(){
 if(anatomyImageURL)return anatomyImageURL;
 if(ANATOMY_BODY_SOURCE.startsWith('data:')&&typeof atob==='function'){
  const bytes=Uint8Array.from(atob(ANATOMY_BODY_SOURCE.split(',')[1]),char=>char.charCodeAt(0));
  anatomyImageURL=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
 }else anatomyImageURL=ANATOMY_BODY_SOURCE;
 return anatomyImageURL;
}

const anatomyRegions=Object.freeze({
 chest:'M181 204Q214 183 264 194L270 217 267 255Q225 287 188 258Z M281 194Q320 183 363 207L357 258Q320 282 282 256L277 217Z',
 shoulders:'M187 181Q146 188 143 229L149 264 169 249 181 216 199 202Z M357 182Q398 188 404 229L399 265 379 250 367 215 348 202Z M652 181Q614 187 595 227L594 260 616 252 638 217 662 199Z M799 181Q838 190 851 229L853 262 833 250 814 217 792 200Z',
 biceps:'M161 254Q146 265 139 303L144 332Q164 319 171 285L173 263Z M384 254Q402 271 409 303L402 333Q384 318 377 285L375 264Z',
 triceps:'M614 256Q593 274 587 307L591 336Q614 317 623 279Z M834 255Q853 272 860 306L857 335Q833 317 825 280Z',
 forearms:'M130 328Q111 350 98 402L87 439 107 448 134 391 146 344Z M416 329Q437 355 449 402L459 439 441 448 414 393 401 344Z M581 329Q559 351 548 402L537 439 555 447 581 394 594 345Z M865 328Q886 353 898 402L909 440 891 448 865 394 853 345Z',
 abdominals:'M240 280Q272 270 307 281L306 343 295 385 275 418 252 386 241 343Z',
 lats:'M648 269Q681 267 715 292L711 350 700 399 675 362 654 318Z M738 291Q773 268 805 270L797 319 775 363 750 400 739 349Z',
 upper_back:'M647 211Q679 215 714 240L714 288 687 301 651 272Z M738 239Q775 215 806 211L805 272 769 300 740 289Z',
 traps:'M707 144L728 160 749 144 759 178 798 195 769 221 739 258 727 275 714 256 684 221 656 195 696 178Z',
 lower_back:'M706 346L726 360 747 346 764 401 748 430 726 415 704 430 688 401Z',
 glutes:'M657 428Q694 401 723 433L724 489Q693 518 651 490Z M731 432Q765 402 800 428L806 490Q765 518 730 489Z',
 quadriceps:'M190 447Q221 425 244 458L247 522 228 598 218 636 198 628 177 573 177 509Z M303 458Q325 426 354 446L368 509 368 574 348 628 328 636 318 600 300 522Z',
 hamstrings:'M654 508Q681 514 712 506L710 565 690 640 668 657 651 603 643 553Z M741 508Q772 517 801 507L812 553 803 603 788 657 764 640 744 566Z',
 calves:'M653 667Q682 652 690 691L686 745 664 807 648 782 639 732Z M762 691Q770 653 800 667L812 732 801 782 785 807 766 745Z',
 neck:'M249 139L272 146 295 138 301 176 287 191 273 174 257 191 244 177Z M708 140L727 146 746 139 756 170 735 183 718 183 697 170Z',
 abductors:'M187 408L207 431 190 473 178 505 174 456Z M357 407L373 456 370 505 357 473 340 431Z',
 adductors:'M247 445L270 477 257 523 243 565 229 555 238 495Z M278 477L300 445 309 495 318 555 305 565 290 523Z'
});

function muscleDiagramSVG(key){
 const region=Object.prototype.hasOwnProperty.call(anatomyRegions,key)?anatomyRegions[key]:'';
 const paths=key==='full_body'?Object.values(anatomyRegions).join(' '):region;
 const heart=key==='cardio'?'<path d="M271 222C220 187 243 154 271 183C300 154 323 187 271 222Z" fill="#289ff5"/>':'';
 return `<span class="anatomy-visual"><svg class="muscle-diagram anatomy-detailed" viewBox="0 0 1000 1000" role="img" aria-label="${esc(muscleLabel(key))}: анатомічна схема спереду та ззаду"><image href="${anatomySourceURL()}" x="0" y="0" width="1000" height="1000"/><g fill="#239de9" fill-opacity=".76" style="mix-blend-mode:multiply"><path d="${paths}"/></g>${heart}</svg><span class="anatomy-view-labels"><span>Спереду</span><span>Ззаду</span></span></span>`;
}

function openMuscleDiagram(key){
 let dialog=document.getElementById('muscleDiagramDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='muscleDiagramDialog';dialog.setAttribute('aria-labelledby','muscleDiagramTitle');document.body.appendChild(dialog);}
 dialog.innerHTML=`<div class="anatomy-dialog-header"><h2 id="muscleDiagramTitle">${esc(muscleLabel(key))}</h2><button type="button" class="subtle" aria-label="Закрити анатомічну схему" onclick="document.getElementById('muscleDiagramDialog').close()">✕</button></div><div class="anatomy-dialog-image">${muscleDiagramSVG(key)}</div><p class="anatomy-note">Синім позначено основну робочу ділянку. Ілюстрація є умовною схемою.</p>`;
 dialog.showModal();
}
